/*
  Warnings:

  - Added the required column `tenantId` to the `Reward` table without a default value. This is not possible if the table is not empty.

*/
-- Step 1: Add tenantId as nullable first
ALTER TABLE "Reward" ADD COLUMN "tenantId" TEXT;

-- Step 2: Get the first tenant ID to assign to existing rewards
-- We'll use a subquery to get the first tenant ID
UPDATE "Reward" 
SET "tenantId" = (SELECT id FROM "Tenant" LIMIT 1)
WHERE "tenantId" IS NULL;

-- Step 3: Make tenantId NOT NULL
ALTER TABLE "Reward" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "Reward_tenantId_idx" ON "Reward"("tenantId");

-- AddForeignKey
ALTER TABLE "Reward" ADD CONSTRAINT "Reward_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
