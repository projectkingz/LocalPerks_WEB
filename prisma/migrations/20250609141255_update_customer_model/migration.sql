/*
  Warnings:

  - You are about to drop the column `email` on the `Customer` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `Customer` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `Customer` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_email_fkey";

-- DropIndex
DROP INDEX "Customer_email_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "email",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_userId_key" ON "Customer"("userId");

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
