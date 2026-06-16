import { prisma } from '../lib/prisma.js';

// ─── Constants ──────────────────────────────────────────────────────────────

// Marker line written at the top of every backup so we can validate on import.
const BACKUP_MARKER = '-- TMC Choir Attendance System — PostgreSQL Backup';

// Tables in FK-dependency order (parents first). Inserting in this order keeps
// foreign-key constraints satisfied without disabling them.
// AuditLog is optional and only included when the caller opts in.
const CORE_TABLE_ORDER = [
  'EvaluationCategory',
  'Semester',
  'Member',
  'User',
  'Session',
  'Officer',
  'Judge',
  'Auditionee',
  'RuleRegulation',
  'AttendanceRecord',
  'JudgeEvaluation',
  'EvaluationScore',
];

const AUDIT_LOG_TABLE = 'AuditLog';

// MySQL-only / non-Postgres statements that may appear in older backup files.
// These are silently skipped on import so legacy exports don't hard-fail.
function isUnsupportedStatement(stmt) {
  return /^SET\s+FOREIGN_KEY_CHECKS/i.test(stmt) || /^\/\*!/.test(stmt);
}

// ─── Import safety: statement whitelist ──────────────────────────────────────
// The import endpoint must NEVER execute arbitrary SQL. We only allow the exact
// statement shapes this system's exporter produces, and we validate that any
// referenced table is one we own. Anything else is rejected outright.

const ALL_TABLES = [...CORE_TABLE_ORDER, AUDIT_LOG_TABLE];
const ALLOWED_TABLE_SET = new Set(ALL_TABLES);

// Extract every double-quoted identifier from a statement, e.g. "User".
function extractQuotedIdents(stmt) {
  const out = [];
  const re = /"((?:[^"]|"")+)"/g;
  let m;
  while ((m = re.exec(stmt)) !== null) {
    out.push(m[1].replace(/""/g, '"'));
  }
  return out;
}

// Validate that a statement is one of the allowed, exporter-generated shapes and
// only touches tables we own. Returns { ok, reason }.
function validateStatement(stmt) {
  const trimmed = stmt.trim();

  // 1) TRUNCATE TABLE "A", "B", ... RESTART IDENTITY CASCADE;
  if (/^TRUNCATE\s+TABLE\s+/i.test(trimmed)) {
    const tables = extractQuotedIdents(trimmed);
    if (tables.length === 0) return { ok: false, reason: 'TRUNCATE without identifiers' };
    const bad = tables.find((t) => !ALLOWED_TABLE_SET.has(t));
    if (bad) return { ok: false, reason: `TRUNCATE references unknown table "${bad}"` };
    return { ok: true };
  }

  // 2) INSERT INTO "Table" (...) VALUES ...;
  if (/^INSERT\s+INTO\s+/i.test(trimmed)) {
    const idents = extractQuotedIdents(trimmed);
    const table = idents[0];
    if (!table) return { ok: false, reason: 'INSERT without a table identifier' };
    if (!ALLOWED_TABLE_SET.has(table)) return { ok: false, reason: `INSERT into unknown table "${table}"` };
    return { ok: true };
  }

  // 3) SELECT setval(pg_get_serial_sequence('"Table"', 'id'), ...);
  if (/^SELECT\s+setval\s*\(/i.test(trimmed)) {
    // Sequence resets reference the table only inside a string literal; require
    // the pg_get_serial_sequence helper and a known table name to be present.
    if (!/pg_get_serial_sequence/i.test(trimmed)) {
      return { ok: false, reason: 'Unexpected SELECT statement' };
    }
    const referencesKnownTable = ALL_TABLES.some((t) => trimmed.includes(`"${t}"`));
    if (!referencesKnownTable) return { ok: false, reason: 'setval references an unknown table' };
    return { ok: true };
  }

  return { ok: false, reason: `Disallowed statement: "${trimmed.slice(0, 40)}..."` };
}

// ─── SQL helpers ──────────────────────────────────────────────────────────────

// Quote a Postgres identifier (table / column name) with double quotes.
function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

// Render a JS value as a Postgres SQL literal.
function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (val instanceof Date) {
    // 'YYYY-MM-DD HH:MM:SS.mmm' — valid for timestamp columns
    return `'${val.toISOString().replace('T', ' ').replace('Z', '')}'`;
  }
  if (typeof val === 'number') {
    return Number.isFinite(val) ? String(val) : 'NULL';
  }
  if (typeof val === 'object') {
    // JSON-ish values — store as escaped JSON text
    return escapeValue(JSON.stringify(val));
  }
  // String — Postgres escapes a single quote by doubling it.
  return `'${String(val).replace(/'/g, "''")}'`;
}

function toInserts(tableName, rows) {
  if (!rows || rows.length === 0) {
    return `-- (no rows in ${quoteIdent(tableName)})\n`;
  }
  const cols = Object.keys(rows[0]).map(quoteIdent).join(', ');
  const values = rows
    .map(row => `  (${Object.values(row).map(escapeValue).join(', ')})`)
    .join(',\n');
  return `INSERT INTO ${quoteIdent(tableName)} (${cols}) VALUES\n${values};\n`;
}

// Reset the id sequence so future auto-increment inserts don't collide with
// the explicit IDs we just restored.
function resetSequence(tableName) {
  return (
    `SELECT setval(` +
    `pg_get_serial_sequence('${quoteIdent(tableName)}', 'id'), ` +
    `COALESCE((SELECT MAX("id") FROM ${quoteIdent(tableName)}), 1), ` +
    `(SELECT COUNT(*) FROM ${quoteIdent(tableName)}) > 0` +
    `);`
  );
}

// State-machine SQL splitter: correctly handles quoted strings and comments.
function splitStatements(sql) {
  const out = [];
  let cur = '';
  let inStr = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];

    if (inStr) {
      cur += ch;
      if (ch === "'") {
        // A doubled '' is an escaped quote, not the end of the string.
        if (sql[i + 1] === "'") {
          cur += sql[++i];
        } else {
          inStr = false;
        }
      }
    } else if (ch === "'") {
      inStr = true;
      cur += ch;
    } else if (ch === '-' && sql[i + 1] === '-') {
      // Line comment — skip to end of line.
      while (i < sql.length && sql[i] !== '\n') i++;
    } else if (ch === ';') {
      const stmt = cur.trim();
      if (stmt) out.push(stmt);
      cur = '';
    } else {
      cur += ch;
    }
  }
  const last = cur.trim();
  if (last) out.push(last);
  return out;
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const exportBackup = async (req, res) => {
  try {
    // Audit logs are included only when explicitly requested (?includeAuditLogs=true).
    const includeAuditLogs = String(req.query.includeAuditLogs) === 'true';
    const tableOrder = includeAuditLogs
      ? [...CORE_TABLE_ORDER, AUDIT_LOG_TABLE]
      : CORE_TABLE_ORDER;

    const [
      evaluationCategories,
      users,
      semesters,
      members,
      sessions,
      officers,
      judges,
      auditionees,
      rules,
      attendanceRecords,
      judgeEvaluations,
      evaluationScores,
      auditLogs,
    ] = await Promise.all([
      prisma.evaluationCategory.findMany({ orderBy: { id: 'asc' } }),
      prisma.user.findMany({ orderBy: { id: 'asc' } }),
      prisma.semester.findMany({ orderBy: { id: 'asc' } }),
      prisma.member.findMany({ orderBy: { id: 'asc' } }),
      prisma.session.findMany({ orderBy: { id: 'asc' } }),
      prisma.officer.findMany({ orderBy: { id: 'asc' } }),
      prisma.judge.findMany({ orderBy: { id: 'asc' } }),
      prisma.auditionee.findMany({ orderBy: { id: 'asc' } }),
      prisma.ruleRegulation.findMany({ orderBy: { id: 'asc' } }),
      prisma.attendanceRecord.findMany({ orderBy: { id: 'asc' } }),
      prisma.judgeEvaluation.findMany({ orderBy: { id: 'asc' } }),
      prisma.evaluationScore.findMany({ orderBy: { id: 'asc' } }),
      includeAuditLogs
        ? prisma.auditLog.findMany({ orderBy: { id: 'asc' } })
        : Promise.resolve([]),
    ]);

    const datasets = {
      EvaluationCategory: evaluationCategories,
      User: users,
      Semester: semesters,
      Member: members,
      Session: sessions,
      Officer: officers,
      Judge: judges,
      Auditionee: auditionees,
      RuleRegulation: rules,
      AttendanceRecord: attendanceRecords,
      JudgeEvaluation: judgeEvaluations,
      EvaluationScore: evaluationScores,
      AuditLog: auditLogs,
    };

    const now = new Date().toISOString();
    const lines = [];

    lines.push(BACKUP_MARKER);
    lines.push(`-- Exported at: ${now}`);
    lines.push(`-- Audit logs included: ${includeAuditLogs ? 'yes' : 'no'}`);
    lines.push(`-- Restore: import this file via Settings > Backup & Recovery`);
    lines.push(`--`);
    lines.push(``);

    // Truncate every table in one statement. CASCADE clears dependents and
    // RESTART IDENTITY resets the auto-increment sequences.
    const truncList = tableOrder.map(quoteIdent).join(', ');
    lines.push(`-- ── Clear all tables ───────────────────────────────────────────────────────`);
    lines.push(`TRUNCATE TABLE ${truncList} RESTART IDENTITY CASCADE;`);
    lines.push(``);

    // Insert in FK-dependency order.
    for (const table of tableOrder) {
      const rows = datasets[table];
      lines.push(`-- ── ${table} (${rows.length} rows) ──`);
      lines.push(toInserts(table, rows));
    }

    // Re-sync sequences to the max id we just inserted.
    lines.push(`-- ── Reset sequences ────────────────────────────────────────────────────────`);
    for (const table of tableOrder) lines.push(resetSequence(table));
    lines.push(``);
    lines.push(`-- End of backup`);

    const sql = lines.join('\n');
    const filename = `tmc-choir-backup-${now.slice(0, 10)}.sql`;

    res.setHeader('Content-Type', 'application/sql');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(sql);
  } catch (err) {
    console.error('Export Backup Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to export backup.' });
  }
};

// ─── Import ───────────────────────────────────────────────────────────────────

export const importBackup = async (req, res) => {
  try {
    const sql = req.body;

    if (!sql || typeof sql !== 'string' || sql.trim().length === 0) {
      return res.status(400).json({ status: 'fail', message: 'No SQL content received.' });
    }

    // Sanity check — must look like a backup from this system.
    if (!sql.includes('TMC Choir Attendance System') || !/TRUNCATE\s+TABLE/i.test(sql)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid backup file. Only .sql files exported from this system are supported.',
      });
    }

    const statements = splitStatements(sql).filter(
      (stmt) => stmt && !stmt.startsWith('--') && !isUnsupportedStatement(stmt)
    );

    if (statements.length === 0) {
      return res.status(400).json({ status: 'fail', message: 'Backup file contains no executable statements.' });
    }

    // SECURITY: never execute arbitrary SQL. Every statement must match one of
    // the exporter-generated shapes (TRUNCATE / INSERT / setval) and reference
    // only tables we own. Reject the whole file if anything else is present.
    for (const stmt of statements) {
      const { ok, reason } = validateStatement(stmt);
      if (!ok) {
        return res.status(400).json({
          status: 'fail',
          message: `Backup file contains a disallowed statement and was rejected. (${reason})`,
        });
      }
    }

    // Run the whole restore atomically: if anything fails, nothing is changed.
    await prisma.$transaction(
      async (tx) => {
        for (const stmt of statements) {
          await tx.$executeRawUnsafe(stmt);
        }
      },
      { timeout: 120000, maxWait: 10000 }
    );

    // Build a restore summary: per-table row counts after the restore.
    const allTables = [...CORE_TABLE_ORDER, AUDIT_LOG_TABLE];
    const counts = await Promise.all(
      allTables.map((table) => {
        const model = table.charAt(0).toLowerCase() + table.slice(1);
        return prisma[model].count().then(
          (n) => ({ table, rows: n }),
          () => ({ table, rows: null }) // table not present / not counted
        );
      })
    );
    const tableCounts = counts.filter((c) => c.rows !== null);
    const totalRows = tableCounts.reduce((sum, c) => sum + c.rows, 0);

    res.status(200).json({
      status: 'success',
      message: `Backup restored successfully. ${statements.length} statements executed.`,
      summary: {
        statements: statements.length,
        tables: tableCounts.length,
        totalRows,
        tableCounts,
      },
    });
  } catch (err) {
    console.error('Import Backup Error:', err);

    // Older MySQL-format exports (backtick identifiers, FOREIGN_KEY_CHECKS, etc.)
    // are not compatible with PostgreSQL. Detect the typical failure codes and
    // guide the user to export a fresh backup.
    const legacyCodes = ['42704', '42601', '42P01'];
    const haystack = `${err.message || ''} ${err.meta?.code || ''} ${err.code || ''}`;
    const isLegacy =
      legacyCodes.some((c) => haystack.includes(c)) || /foreign_key_checks/i.test(haystack);

    res.status(500).json({
      status: 'error',
      message: isLegacy
        ? 'This backup file is from an older, incompatible format. Please export a fresh backup with the current version, then import that file.'
        : `Failed to import backup: ${err.message}`,
    });
  }
};
