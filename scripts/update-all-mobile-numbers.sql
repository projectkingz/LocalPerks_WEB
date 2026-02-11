-- SQL script to update all mobile numbers to +447402611112
-- Run this directly in your database if Prisma script fails

-- Update Customer mobile numbers
UPDATE Customer 
SET mobile = '+447402611112'
WHERE mobile IS NOT NULL;

-- Update Tenant (Partner) mobile numbers
UPDATE Tenant 
SET mobile = '+447402611112'
WHERE mobile IS NOT NULL;

-- Update Admin mobile numbers
UPDATE Admin 
SET mobile = '+447402611112'
WHERE mobile IS NOT NULL;

-- Verify updates
SELECT 
    'Customer' as table_name,
    COUNT(*) as count,
    COUNT(DISTINCT mobile) as unique_mobiles
FROM Customer
WHERE mobile = '+447402611112'

UNION ALL

SELECT 
    'Tenant' as table_name,
    COUNT(*) as count,
    COUNT(DISTINCT mobile) as unique_mobiles
FROM Tenant
WHERE mobile = '+447402611112'

UNION ALL

SELECT 
    'Admin' as table_name,
    COUNT(*) as count,
    COUNT(DISTINCT mobile) as unique_mobiles
FROM Admin
WHERE mobile = '+447402611112';






