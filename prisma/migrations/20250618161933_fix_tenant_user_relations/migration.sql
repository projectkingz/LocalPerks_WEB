/*
  Warnings:

  - Added the required column `tenantId` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partnerUserId` to the `Tenant` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "partnerUserId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_partnerUserId_fkey" FOREIGN KEY ("partnerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
