/*
  Warnings:

  - You are about to drop the column `email` on the `Member` table. All the data in the column will be lost.
  - You are about to drop the column `facebookAccount` on the `Member` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `EvaluationCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `Member` DROP COLUMN `email`,
    DROP COLUMN `facebookAccount`,
    ADD COLUMN `emailOrFacebook` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `EvaluationCategory_name_key` ON `EvaluationCategory`(`name`);
