/**
 * Backfill script — creates User accounts for all Members that don't have one.
 * Run locally:    node prisma/backfill-accounts.js
 * Run on Neon:    node prisma/backfill-accounts.js --prod
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.argv.includes('--prod');

dotenv.config({
  path: path.resolve(__dirname, isProd ? '../../.env.production' : '../../.env'),
});

console.log(`[backfill] Mode    : ${isProd ? 'PRODUCTION (Neon)' : 'LOCAL'}`);
console.log(`[backfill] DB      : ${process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ':****@')}`);

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = 'tmcchoir2026';

async function main() {
  const membersWithoutAccount = await prisma.member.findMany({
    where: { user: null },
    orderBy: { fullName: 'asc' },
  });

  if (membersWithoutAccount.length === 0) {
    console.log('[backfill] All members already have accounts. Nothing to do.');
    return;
  }

  console.log(`[backfill] Found ${membersWithoutAccount.length} member(s) without accounts. Creating...\n`);

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  let created = 0;
  let skipped = 0;

  for (const member of membersWithoutAccount) {
    try {
      const baseUsername = member.fullName.toLowerCase().replace(/\s+/g, '.');
      let username = baseUsername;
      let counter = 1;

      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`;
        counter++;
      }

      await prisma.user.create({
        data: {
          username,
          passwordHash,
          role: 'member',
          memberId: member.id,
        },
      });

      console.log(`  ✓ ${member.fullName}  →  "${username}"`);
      created++;
    } catch (err) {
      console.error(`  ✗ Skipped ${member.fullName}: ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n[backfill] Done. Created: ${created}  Skipped: ${skipped}`);
  console.log(`[backfill] Default password for all new accounts: "${DEFAULT_PASSWORD}"`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
