ALTER TABLE `Judge` ADD COLUMN `semesterId` INTEGER NULL;

UPDATE `Judge`
SET `semesterId` = (
    SELECT `id`
    FROM (
        SELECT `id`
        FROM `Semester`
        ORDER BY
            CASE WHEN `endDate` IS NULL THEN 0 ELSE 1 END,
            `startDate` DESC,
            `createdAt` DESC,
            `id` DESC
        LIMIT 1
    ) AS `latestSemester`
)
WHERE `semesterId` IS NULL;

CREATE INDEX `Judge_semesterId_idx` ON `Judge`(`semesterId`);

ALTER TABLE `Judge`
ADD CONSTRAINT `Judge_semesterId_fkey`
FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`)
ON DELETE SET NULL ON UPDATE CASCADE;
