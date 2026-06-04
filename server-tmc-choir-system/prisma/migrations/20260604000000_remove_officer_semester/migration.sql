-- Migration: Remove semester link from Officer, replace with Member link
-- Officers are now independent of semesters and are linked directly to Members

-- Step 1: Drop the FK constraint on semesterId
ALTER TABLE `Officer` DROP FOREIGN KEY `Officer_semesterId_fkey`;

-- Step 2: Drop old columns (semesterId, fullName, contactNo, email, facebookAccount)
ALTER TABLE `Officer`
  DROP COLUMN `semesterId`,
  DROP COLUMN `fullName`,
  DROP COLUMN `contactNo`,
  DROP COLUMN `email`,
  DROP COLUMN `facebookAccount`;

-- Step 3: Rename dutiesNotes -> duties (via ADD + data copy + DROP for compatibility)
ALTER TABLE `Officer` ADD COLUMN `duties` TEXT NULL;
UPDATE `Officer` SET `duties` = `dutiesNotes` WHERE `dutiesNotes` IS NOT NULL;
ALTER TABLE `Officer` DROP COLUMN `dutiesNotes`;

-- Step 4: Add memberId (nullable first to allow existing rows to survive)
ALTER TABLE `Officer` ADD COLUMN `memberId` INT NULL;

-- Step 5: Add updatedAt
ALTER TABLE `Officer` ADD COLUMN `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3);

-- Step 6: If there are existing officer rows with no member, delete them (they were broken anyway)
DELETE FROM `Officer` WHERE `memberId` IS NULL;

-- Step 7: Make memberId NOT NULL
ALTER TABLE `Officer` MODIFY COLUMN `memberId` INT NOT NULL;

-- Step 8: Add the FK constraint to Member
ALTER TABLE `Officer` ADD CONSTRAINT `Officer_memberId_fkey`
  FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
