import { prisma } from '../lib/prisma.js';

// ─── SQL helpers ──────────────────────────────────────────────────────────────

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? '1' : '0';
  if (val instanceof Date) {
    // 'YYYY-MM-DD HH:MM:SS'
    return `'${val.toISOString().replace('T', ' ').slice(0, 19)}'`;
  }
  if (typeof val === 'number') return String(val);
  // String — escape backslash, single quote, NUL, newline, carriage return
  const escaped = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\x00/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r');
  return `'${escaped}'`;
}

function toInserts(tableName, rows) {
  if (!rows || rows.length === 0) return `-- (no rows in \`${tableName}\`)\n`;
  const cols = Object.keys(rows[0]).map(c => `\`${c}\``).join(', ');
  const values = rows
    .map(row => `  (${Object.values(row).map(escapeValue).join(', ')})`)
    .join(',\n');
  return `INSERT INTO \`${tableName}\` (${cols}) VALUES\n${values};\n`;
}

// State-machine SQL splitter: correctly handles quoted strings
function splitStatements(sql) {
  const out = [];
  let cur = '';
  let inStr = false;
  let strChar = '';

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = i > 0 ? sql[i - 1] : '';

    if (inStr) {
      cur += ch;
      if (ch === strChar && prev !== '\\') inStr = false;
    } else if (ch === "'" || ch === '"' || ch === '`') {
      inStr = true;
      strChar = ch;
      cur += ch;
    } else if (ch === '-' && sql[i + 1] === '-') {
      // Line comment — skip to end of line
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
    // Fetch all tables (insertion order respects FK dependencies)
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
    ]);

    const now = new Date().toISOString();
    const lines = [];

    lines.push(`-- TMC Choir Attendance System — SQL Backup`);
    lines.push(`-- Exported at: ${now}`);
    lines.push(`-- Restore: import this file via Settings > Backup & Recovery`);
    lines.push(`--`);
    lines.push(``);
    lines.push(`SET FOREIGN_KEY_CHECKS = 0;`);
    lines.push(``);

    // Truncate in reverse FK order
    const truncateOrder = [
      'EvaluationScore', 'JudgeEvaluation', 'AttendanceRecord',
      'RuleRegulation', 'Auditionee', 'Judge', 'Officer',
      'Session', 'Member', 'Semester', 'User', 'EvaluationCategory',
    ];
    lines.push(`-- ── Truncate all tables ────────────────────────────────────────────────────`);
    for (const t of truncateOrder) lines.push(`TRUNCATE TABLE \`${t}\`;`);
    lines.push(``);

    // Insert in FK order
    const datasets = [
      ['EvaluationCategory', evaluationCategories],
      ['User', users],
      ['Semester', semesters],
      ['Member', members],
      ['Session', sessions],
      ['Officer', officers],
      ['Judge', judges],
      ['Auditionee', auditionees],
      ['RuleRegulation', rules],
      ['AttendanceRecord', attendanceRecords],
      ['JudgeEvaluation', judgeEvaluations],
      ['EvaluationScore', evaluationScores],
    ];

    for (const [table, rows] of datasets) {
      lines.push(`-- ── ${table} (${rows.length} rows) ${'─'.repeat(Math.max(0, 60 - table.length - String(rows.length).length - 12))}`);
      lines.push(toInserts(table, rows));
    }

    lines.push(`SET FOREIGN_KEY_CHECKS = 1;`);
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

    // Basic sanity check — must look like our backup
    if (!sql.includes('SET FOREIGN_KEY_CHECKS')) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid backup file. Only .sql files exported from this system are supported.',
      });
    }

    const statements = splitStatements(sql);
    let executed = 0;
    const errors = [];

    for (const stmt of statements) {
      if (!stmt || stmt.startsWith('--')) continue;
      try {
        await prisma.$executeRawUnsafe(stmt);
        executed++;
      } catch (err) {
        errors.push({ stmt: stmt.slice(0, 120), error: err.message });
      }
    }

    if (errors.length > 0) {
      return res.status(207).json({
        status: 'partial',
        message: `Imported with ${errors.length} error(s). ${executed} statements succeeded.`,
        errors: errors.slice(0, 10), // cap to first 10
      });
    }

    res.status(200).json({
      status: 'success',
      message: `Backup restored successfully. ${executed} statements executed.`,
    });
  } catch (err) {
    console.error('Import Backup Error:', err);
    res.status(500).json({ status: 'error', message: 'Failed to import backup.' });
  }
};
