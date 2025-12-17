-- AlterTable
-- Make Tenant.mobile required (all existing tenants now have mobile numbers)
ALTER TABLE `Tenant` MODIFY `mobile` VARCHAR(191) NOT NULL;

-- AlterTable  
-- Make Admin.mobile required
ALTER TABLE `Admin` MODIFY `mobile` VARCHAR(191) NOT NULL;

-- Note: Customer.mobile is already required in the schema





