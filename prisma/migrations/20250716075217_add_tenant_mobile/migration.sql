/*
  Warnings:

  - You are about to drop the column `phone` on the `Customer` table. All the data in the column will be lost.
  - Added the required column `mobile` to the `Customer` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tenantId` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "phone",
ADD COLUMN     "mobile" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Reward" ADD COLUMN     "tenantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "mobile" TEXT;

-- CreateIndex
CREATE INDEX "Reward_tenantId_idx" ON "Reward"("tenantId");

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
