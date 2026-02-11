-- Add platformReward column to system_config table
-- Run this SQL directly in your database

ALTER TABLE `system_config` 
ADD COLUMN `platformReward` FLOAT DEFAULT 0.007 AFTER `pointFaceValue`;

-- Update existing records to have the default value
UPDATE `system_config` 
SET `platformReward` = 0.007 
WHERE `platformReward` IS NULL;
