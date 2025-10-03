/*
  Warnings:

  - You are about to drop the column `tenantId` on the `Reward` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Reward" DROP CONSTRAINT "Reward_tenantId_fkey";

-- DropIndex
DROP INDEX "Reward_tenantId_idx";

-- AlterTable
ALTER TABLE "Reward" DROP COLUMN "tenantId";
