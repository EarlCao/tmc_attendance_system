import { prisma } from "../src/lib/prisma.js";
import bcrypt from "bcrypt";
import { BCRYPT_COST } from "../src/lib/security.js";

/**
 * FULL DEMO SEED
 * --------------
 * Resets the database, then populates a large, realistic dataset spanning
 * 5 semesters: evaluation categories, members (each with a linked login),
 * officers, sessions with attendance records, judges, auditionees with
 * judge evaluations + category scores, and rules.
 *
 * Usage:
 *   SEED_ADMIN_PASSWORD=<your-password> npm run db:seed:demo
 *
 * Example logins after seeding:
 *   ADMIN  -> username: admin          password: <value of SEED_ADMIN_PASSWORD>
 *   MEMBER -> username: maria.santos   password: tmcchoir2026
 *            (every demo member uses the same password: "tmcchoir2026";
 *             usernames are firstname.lastname, lowercased, dot-separated)
 */

const DEMO_MEMBER_PASSWORD = "tmcchoir2026";

const VOICE_TYPES = ["SOPRANO", "ALTO", "TENOR", "BASS"];
const ATT_STATUSES = ["PRESENT", "PRESENT", "PRESENT", "LATE", "ABSENT", "EXCUSED"];
const COURSES = ["BSIT", "BSCS", "BSED", "BSBA", "BSN", "BEED", "BSA", "BSHM"];
const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const RELIGIONS = ["Roman Catholic", "Born Again", "Iglesia ni Cristo", "Baptist", "Seventh-day Adventist"];

const FIRST_NAMES = [
  "Maria", "Jose", "Juan", "Ana", "Pedro", "Rosa", "Mark", "Grace", "Paolo", "Liza",
  "Carlo", "Diane", "Miguel", "Sofia", "Rafael", "Bea", "Angelo", "Nicole", "Daniel", "Camille",
  "Francis", "Patricia", "Gabriel", "Andrea", "Joshua", "Kristine", "Vincent", "Mae", "Aaron", "Hannah",
  "Christian", "Erika", "Jericho", "Trisha", "Lorenzo", "Yumi", "Emmanuel", "Clarisse", "Nathaniel", "Joy",
];
const LAST_NAMES = [
  "Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Mendoza", "Torres", "Flores", "Villanueva",
  "Ramos", "Gonzales", "Aquino", "Castillo", "Domingo", "Salvador", "Navarro", "Pascual", "Del Rosario", "Aguilar",
];

// Deterministic-ish pseudo random for reproducible-ish runs (still varied enough).
let _seed = 42;
const rand = () => {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;

async function wipeDatabase() {
  console.log("🧹 Wiping all existing data...");
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
  console.log("🌱 Seeding database (FULL DEMO — 5 semesters)...");

  await wipeDatabase();

  // ── 1. ADMIN ────────────────────────────────────────────────────────────
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminPassword) {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required to seed the admin account. " +
      "Set it in your environment before running the seed."
    );
  }
  const adminHash = await bcrypt.hash(adminPassword, BCRYPT_COST);
  const admin = await prisma.user.create({
    data: { username: "admin", email: "admin@tmc.com", passwordHash: adminHash, role: "ADMIN" },
  });
  console.log("✅ Admin created:", admin.username);

  // ── 2. EVALUATION CATEGORIES (sum to 100) ─────────────────────────────────
  const categoryData = [
    { name: "Pitch Accuracy", description: "Correctness of pitch and intonation", percentage: 30 },
    { name: "Tone Quality", description: "Richness and control of vocal tone", percentage: 25 },
    { name: "Rhythm", description: "Timing and rhythmic precision", percentage: 20 },
    { name: "Stage Presence", description: "Confidence and audience engagement", percentage: 25 },
  ];
  const categories = [];
  for (const cat of categoryData) {
    categories.push(await prisma.evaluationCategory.create({ data: cat }));
  }
  console.log(`✅ ${categories.length} evaluation categories created`);

  // ── 3. MEMBERS + LINKED USER ACCOUNTS ─────────────────────────────────────
  const memberPasswordHash = await bcrypt.hash(DEMO_MEMBER_PASSWORD, BCRYPT_COST);
  const usedUsernames = new Set(["admin"]);
  const members = [];
  const MEMBER_COUNT = 40;
  for (let i = 0; i < MEMBER_COUNT; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = pick(LAST_NAMES);
    const fullName = `${first} ${last}`;

    const member = await prisma.member.create({
      data: {
        fullName,
        voiceType: VOICE_TYPES[i % VOICE_TYPES.length],
        contactNo: `09${randInt(100000000, 999999999)}`,
        address: `${randInt(1, 999)} Sample St., Brgy. ${randInt(1, 20)}`,
        religion: pick(RELIGIONS),
        course: pick(COURSES),
        yearLevel: pick(YEAR_LEVELS),
        emailOrFacebook: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, "")}@example.com`,
        status: i < MEMBER_COUNT - 5 ? "ACTIVE" : pick(["INACTIVE", "ALUMNI", "GRADUATED"]),
      },
    });

    // Unique username firstname.lastname
    let base = fullName.toLowerCase().replace(/\s+/g, ".");
    let username = base;
    let counter = 1;
    while (usedUsernames.has(username)) {
      username = `${base}${counter++}`;
    }
    usedUsernames.add(username);

    await prisma.user.create({
      data: { username, passwordHash: memberPasswordHash, role: "MEMBER", memberId: member.id },
    });

    members.push(member);
  }
  console.log(`✅ ${members.length} members + linked accounts created`);

  // ── 4. OFFICERS (subset of active members) ────────────────────────────────
  const positions = ["President", "Vice President", "Secretary", "Treasurer", "Auditor", "P.R.O."];
  for (let i = 0; i < positions.length; i++) {
    await prisma.officer.create({
      data: {
        memberId: members[i].id,
        position: positions[i],
        duties: `Responsible for ${positions[i]} duties of the choir.`,
        status: "ACTIVE",
      },
    });
  }
  console.log(`✅ ${positions.length} officers created`);

  // ── 5. JUDGES ─────────────────────────────────────────────────────────────
  const judgeNames = [
    { fullName: "Prof. Antonio Liwanag", titleRole: "Choir Director", specialization: "Classical Voice" },
    { fullName: "Ms. Carmela Verano", titleRole: "Voice Coach", specialization: "Pop / Contemporary" },
    { fullName: "Mr. Diego Salcedo", titleRole: "Music Theory Instructor", specialization: "Harmony" },
    { fullName: "Dr. Felisa Montano", titleRole: "Guest Adjudicator", specialization: "Opera" },
    { fullName: "Mr. Rommel Diaz", titleRole: "Vocal Arranger", specialization: "A Cappella" },
  ];

  // ── 6. SEMESTERS (5) with sessions, attendance, auditionees ───────────────
  const semesterNames = [
    "1st Semester A.Y. 2023-2024",
    "2nd Semester A.Y. 2023-2024",
    "1st Semester A.Y. 2024-2025",
    "2nd Semester A.Y. 2024-2025",
    "1st Semester A.Y. 2025-2026",
  ];
  const sessionTypes = ["Practice", "Performance", "Meeting", "Workshop"];

  let totalSessions = 0;
  let totalAttendance = 0;
  let totalAuditionees = 0;
  let totalEvaluations = 0;

  for (let s = 0; s < semesterNames.length; s++) {
    const isLast = s === semesterNames.length - 1;
    const startYear = 2023 + Math.floor(s / 2);
    const startMonth = s % 2 === 0 ? 5 : 10; // June-ish or November-ish
    const startDate = new Date(startYear, startMonth, 1);
    const endDate = isLast ? null : new Date(startYear, startMonth + 4, 28);

    const semester = await prisma.semester.create({
      data: {
        name: semesterNames[s],
        startDate,
        endDate,
        notes: `${semesterNames[s]} choir activities.`,
      },
    });

    // Rules per semester
    await prisma.ruleRegulation.create({
      data: {
        semesterId: semester.id,
        title: "Attendance Policy",
        content: "Members must attend at least 80% of rehearsals to remain in good standing.",
        category: "Attendance",
        status: "active",
      },
    });
    await prisma.ruleRegulation.create({
      data: {
        semesterId: semester.id,
        title: "Conduct & Decorum",
        content: "Members must observe respect and discipline during all sessions and performances.",
        category: "Conduct",
        status: "active",
      },
    });

    // Judges (link a couple to each semester)
    const semesterJudges = [];
    for (let j = 0; j < judgeNames.length; j++) {
      const judge = await prisma.judge.create({
        data: {
          ...judgeNames[j],
          semesterId: semester.id,
          contactNo: `0917${randInt(1000000, 9999999)}`,
          email: `${judgeNames[j].fullName.split(" ").pop().toLowerCase()}@judges.example.com`,
          notes: "Invited adjudicator.",
        },
      });
      semesterJudges.push(judge);
    }

    // Sessions per semester (~8) with attendance for active members
    const sessionCount = randInt(7, 9);
    const activeMembers = members.filter((m) => m.status === "ACTIVE");
    for (let k = 0; k < sessionCount; k++) {
      const sessionDate = new Date(startYear, startMonth, randInt(1, 28));
      const session = await prisma.session.create({
        data: {
          semesterId: semester.id,
          title: `${pick(sessionTypes)} Session ${k + 1}`,
          sessionDate,
          description: "Regular choir activity.",
          type: pick(sessionTypes),
          location: "TMC Music Room",
        },
      });
      totalSessions++;

      // Attendance records for each active member
      const records = activeMembers.map((m) => {
        const status = pick(ATT_STATUSES);
        const row = {
          sessionId: session.id,
          memberId: m.id,
          status,
          notes: "",
        };
        if (status === "EXCUSED") {
          row.excuseReason = "Family / academic conflict";
          row.excuseStatus = pick(["Pending", "Approved", "Rejected"]);
          if (row.excuseStatus !== "Pending") row.reviewedAt = new Date(sessionDate.getTime() + 86400000);
        }
        return row;
      });
      await prisma.attendanceRecord.createMany({ data: records });
      totalAttendance += records.length;
    }

    // Auditionees per semester (~10) with evaluations + scores
    const auditioneeCount = randInt(8, 12);
    for (let a = 0; a < auditioneeCount; a++) {
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const auditionDate = new Date(startYear, startMonth, randInt(1, 15));
      const auditionee = await prisma.auditionee.create({
        data: {
          semesterId: semester.id,
          fullName: `${first} ${last}`,
          age: randInt(17, 24),
          targetVoiceType: pick(VOICE_TYPES),
          course: pick(COURSES),
          yearLevel: pick(YEAR_LEVELS),
          contactNo: `09${randInt(100000000, 999999999)}`,
          religion: pick(RELIGIONS),
          email: `${first.toLowerCase()}.${last.toLowerCase().replace(/\s+/g, "")}@aud.example.com`,
          address: `${randInt(1, 999)} Audition Ave.`,
          auditionDate,
          status: pick(["Pending", "Pending", "Accepted", "Rejected", "Waitlisted"]),
        },
      });
      totalAuditionees++;

      // Each auditionee evaluated by 2-3 judges
      const judgeSubset = [...semesterJudges].sort(() => rand() - 0.5).slice(0, randInt(2, 3));
      let ratingSum = 0;
      let ratingCount = 0;
      for (const judge of judgeSubset) {
        const evaluation = await prisma.judgeEvaluation.create({
          data: {
            auditioneeId: auditionee.id,
            judgeId: judge.id,
            comments: "Promising vocal ability.",
            overallNotes: "Recommend for callback.",
          },
        });
        totalEvaluations++;

        // One score per category
        let weighted = 0;
        let weightTotal = 0;
        for (const cat of categories) {
          const score = randInt(70, 98);
          await prisma.evaluationScore.create({
            data: { evaluationId: evaluation.id, categoryId: cat.id, score },
          });
          weighted += score * cat.percentage;
          weightTotal += cat.percentage;
        }
        ratingSum += weightTotal > 0 ? weighted / weightTotal : 0;
        ratingCount++;
      }

      if (ratingCount > 0) {
        const avg = Math.round((ratingSum / ratingCount) * 100) / 100;
        await prisma.auditionee.update({ where: { id: auditionee.id }, data: { averageRating: avg } });
      }
    }

    console.log(`  ✅ ${semester.name}: sessions, attendance, judges, ${auditioneeCount} auditionees`);
  }

  console.log("\n📊 Demo data summary:");
  console.log(`   Semesters     : ${semesterNames.length}`);
  console.log(`   Members       : ${members.length} (each with a login)`);
  console.log(`   Sessions      : ${totalSessions}`);
  console.log(`   Attendance    : ${totalAttendance} records`);
  console.log(`   Auditionees   : ${totalAuditionees}`);
  console.log(`   Evaluations   : ${totalEvaluations}`);
  console.log(`   Judges        : ${judgeNames.length} per semester`);
  console.log(`   Categories    : ${categories.length}`);
  console.log("\n🔑 Demo member login example:");
  console.log(`   username: ${pick(members).fullName.toLowerCase().replace(/\s+/g, ".")}`);
  console.log(`   password: ${DEMO_MEMBER_PASSWORD}`);
  console.log("\n🎉 Full demo seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Demo seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
