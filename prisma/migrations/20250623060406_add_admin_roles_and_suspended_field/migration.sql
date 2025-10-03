-- AlterTable
ALTER TABLE "User" ADD COLUMN     "suspended" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_suspended_idx" ON "User"("suspended");
