/**
 * Round-trip restore test for the Backup & Recovery feature.
 *
 * It exercises the real export/import controllers against the live database:
 *   1. Snapshot current row counts for every backed-up table.
 *   2. Export a backup (with audit logs included) to an in-memory SQL string.
 *   3. Import that same SQL back through the import controller.
 *   4. Re-count rows and assert they match the original snapshot.
 *
 * Because the import TRUNCATEs and re-inserts, a passing run proves the
 * generated Postgres SQL is valid end-to-end (identifiers, escaping,
 * FK ordering, sequence resets, transactional execution).
 *
 * Run:  node src/test/backup.roundtrip.test.js
 *
 * NOTE: This mutates the connected database (truncate + reinsert of the same
 * data). Point DATABASE_URL at a dev/test database, not production.
 */
import { prisma } from '../lib/prisma.js';
import { exportBackup, importBackup } from '../controller/backup.controller.js';

const TABLES = [
  'evaluationCategory',
  'user',
  'semester',
  'member',
  'session',
  'officer',
  'judge',
  'auditionee',
  'ruleRegulation',
  'attendanceRecord',
  'judgeEvaluation',
  'evaluationScore',
  'auditLog',
];

// Minimal Express response stub that captures status + body.
function makeRes() {
  const res = {
    statusCode: 200,
    body: undefined,
    headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    send(payload) { this.body = payload; return this; },
  };
  return res;
}

async function countAll() {
  const counts = {};
  for (const t of TABLES) {
    counts[t] = await prisma[t].count();
  }
  return counts;
}

async function main() {
  console.log('— Backup round-trip test —\n');

  const before = await countAll();
  console.log('Row counts BEFORE:', before);

  // 1) Export (include audit logs so every table is exercised).
  const exportRes = makeRes();
  await exportBackup({ query: { includeAuditLogs: 'true' } }, exportRes);

  if (exportRes.statusCode !== 200 || typeof exportRes.body !== 'string') {
    throw new Error(`Export failed (status ${exportRes.statusCode}): ${JSON.stringify(exportRes.body)}`);
  }
  const sql = exportRes.body;
  console.log(`\nExported backup: ${sql.length} bytes`);

  if (!sql.includes('TMC Choir Attendance System')) {
    throw new Error('Export is missing the backup marker.');
  }

  // 2) Import the exported SQL back.
  const importRes = makeRes();
  await importBackup({ body: sql }, importRes);

  if (importRes.statusCode !== 200 || importRes.body?.status !== 'success') {
    throw new Error(`Import failed (status ${importRes.statusCode}): ${JSON.stringify(importRes.body)}`);
  }
  console.log('Import result:', importRes.body.message);

  // 3) Re-count and compare.
  const after = await countAll();
  console.log('\nRow counts AFTER:', after);

  const mismatches = TABLES.filter((t) => before[t] !== after[t]);
  if (mismatches.length > 0) {
    for (const t of mismatches) {
      console.error(`  ✗ ${t}: ${before[t]} -> ${after[t]}`);
    }
    throw new Error(`Row counts changed for: ${mismatches.join(', ')}`);
  }

  console.log('\n✓ PASS — all table row counts preserved after export → import round-trip.');
}

main()
  .catch((err) => {
    console.error('\n✗ FAIL —', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
