-- AlterTable: Add validFrom and validTo date fields to Reward table
ALTER TABLE `Reward` ADD COLUMN `validFrom` DATETIME(3) NULL;
ALTER TABLE `Reward` ADD COLUMN `validTo` DATETIME(3) NULL;

-- Add index on validTo for efficient expiry queries
CREATE INDEX `Reward_validTo_idx` ON `Reward`(`validTo`);
