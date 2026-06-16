import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcrypt";

async function main() {
  console.log("🌱 Seeding database...");

  // =========================
  // 1. CREATE ADMIN USER
  // =========================
  // The admin password must be supplied via env so no credential lives in source.
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required to seed the admin account. " +
      "Set it in your environment before running the seed."
    );
  }
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@tmc.com",
      passwordHash: hashedPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin created:", admin.username);

  // =========================
  // 2. DEFAULT EVALUATION CATEGORIES
  // =========================
  const categories = [
    { name: "Pitch Accuracy", percentage: 30 },
    { name: "Tone Quality", percentage: 25 },
    { name: "Rhythm", percentage: 20 },
    { name: "Stage Presence", percentage: 25 },
  ];

  for (const cat of categories) {
    await prisma.evaluationCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("✅ Evaluation categories seeded");

  // =========================
  // 3. SAMPLE SEMESTER
  // =========================
  const semester = await prisma.semester.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: "1st Semester",
      notes: "Initial semester setup",
    },
  });

  console.log("✅ Semester seeded:", semester.name);

  // =========================
  // 4. SAMPLE SESSION
  // =========================
  await prisma.session.create({
    data: {
      title: "First Rehearsal",
      sessionDate: new Date(),
      semesterId: semester.id,
      description: "Opening choir session",
    },
  });

  console.log("✅ Sample session created");

  // =========================
  // 5. SAMPLE RULES
  // =========================
  await prisma.ruleRegulation.create({
    data: {
      title: "Attendance Policy",
      content: "Members must attend at least 80% of rehearsals.",
      semesterId: semester.id,
    },
  });

  console.log("✅ Rules seeded");

  console.log("🎉 Seeding completed successfully!");
}

// Run the main function and handle errors
main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });