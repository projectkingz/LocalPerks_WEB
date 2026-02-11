-- Add post-signup question fields to Customer table
-- Run this migration manually in PlanetScale console or via deploy request

ALTER TABLE Customer 
ADD COLUMN postcodeOutward VARCHAR(191) NULL COMMENT 'Postcode outward code (e.g., SW1A)',
ADD COLUMN postcodeInward VARCHAR(191) NULL COMMENT 'Postcode inward code (e.g., 1AA)',
ADD COLUMN yearOfBirth INT NULL COMMENT 'Year of birth',
ADD COLUMN ewardPreference VARCHAR(191) NULL COMMENT 'Money off, Free items, Exclusive local events, Surprise gifts',
ADD COLUMN homeOwner BOOLEAN NULL COMMENT 'Yes or No',
ADD COLUMN carOwner BOOLEAN NULL COMMENT 'Yes or No';
