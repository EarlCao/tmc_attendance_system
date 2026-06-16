import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcrypt";
import { BCRYPT_COST } from "../src/lib/security.js";

/**
 * ADMIN-ONLY SEED
 * ---------------
 * Resets the database to a clean state containing ONLY the admin account.
 * Every other table (members, sessions, auditionees, judges, rules, categories,
 * semesters, audit logs, etc.) is wiped first.
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD=<your-password> npm run db:seed
 *
 * Admin login after seeding:
 *   username: admin
 *   password: <value of SEED_ADMIN_PASSWORD>
 *
 * For a fully populated demo dataset instead, run `npm run db:seed:demo`.
 */

// Delete in foreign-key-safe order: children before parents.
async function wipeDatabase() {
  console.log("🧹 Wiping all existing data...");
  // Order matters — rows that reference other rows must be removed first.
  await prisma.evaluationScore.deleteMany();
  await prisma.judgeEvaluation.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.session.deleteMany();
  await prisma.officer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.member.deleteMany();
  await prisma.auditionee.deleteMany();
  await prisma.judge.deleteMany();
  await prisma.ruleRegulation.deleteMany();
  await prisma.evaluationCategory.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.auditLog.deleteMany();
  console.log("✅ Database wiped clean.");
}

async function main() {
  console.log("🌱 Seeding database (ADMIN ONLY)...");

  await wipeDatabase();

  // The admin password must be supplied via env so no credential lives in source.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required to seed the admin account. " +
      "Set it in your environment before running the seed."
    );
  }
  const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_COST);

  const admin = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@tmc.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created:", admin.username);
  console.log("🎉 Admin-only seed completed. The database contains only the admin account.");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
