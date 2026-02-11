-- AlterTable: Rename points column to discountPercentage and change type from INT to DOUBLE
-- First, add the new column as nullable
ALTER TABLE `Reward` ADD COLUMN `discountPercentage` DOUBLE NULL;

-- Migrate data: Convert points to discountPercentage (assuming points were used as percentage, adjust if needed)
-- If points were not percentages, you may need to adjust this conversion
UPDATE `Reward` SET `discountPercentage` = CAST(`points` AS DOUBLE);

-- Make the column NOT NULL after data migration
ALTER TABLE `Reward` MODIFY COLUMN `discountPercentage` DOUBLE NOT NULL;

-- Drop the old points column
ALTER TABLE `Reward` DROP COLUMN `points`;
