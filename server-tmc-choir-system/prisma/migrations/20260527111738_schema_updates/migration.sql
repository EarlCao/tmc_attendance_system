-- AlterTable
ALTER TABLE "AttendanceRecord" ADD COLUMN "excuseReason" TEXT,
    ADD COLUMN "excuseStatus" TEXT DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "Auditionee" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE "RuleRegulation" ADD COLUMN "category" TEXT NOT NULL DEFAULT 'General',
    ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Session" ADD COLUMN "location" TEXT DEFAULT 'TMC Music Room',
    ADD COLUMN "type" TEXT NOT NULL DEFAULT 'Practice';

