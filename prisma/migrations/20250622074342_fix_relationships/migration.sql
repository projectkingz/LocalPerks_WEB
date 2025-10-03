/*
  Warnings:

  - You are about to drop the column `partnerId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `Partner` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_partnerId_fkey";

-- DropIndex
DROP INDEX "Transaction_partnerId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "partnerId";

-- DropTable
DROP TABLE "Partner";
