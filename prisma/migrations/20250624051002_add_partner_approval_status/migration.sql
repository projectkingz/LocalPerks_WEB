-- AlterTable
ALTER TABLE "User" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX "User_approvalStatus_idx" ON "User"("approvalStatus");
