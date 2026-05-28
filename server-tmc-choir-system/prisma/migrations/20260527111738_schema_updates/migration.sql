-- AlterTable
ALTER TABLE `AttendanceRecord` ADD COLUMN `excuseReason` TEXT NULL,
    ADD COLUMN `excuseStatus` VARCHAR(191) NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `Auditionee` ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'Pending';

-- AlterTable
ALTER TABLE `RuleRegulation` ADD COLUMN `category` VARCHAR(191) NOT NULL DEFAULT 'General',
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE `Session` ADD COLUMN `location` VARCHAR(191) NULL DEFAULT 'TMC Music Room',
    ADD COLUMN `type` VARCHAR(191) NOT NULL DEFAULT 'Practice';
