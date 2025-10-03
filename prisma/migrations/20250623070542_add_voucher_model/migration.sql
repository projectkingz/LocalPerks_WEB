-- CreateTable
CREATE TABLE "Voucher" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "redemptionId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "usedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Voucher_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_code_key" ON "Voucher"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Voucher_redemptionId_key" ON "Voucher"("redemptionId");

-- CreateIndex
CREATE INDEX "Voucher_customerId_idx" ON "Voucher"("customerId");

-- CreateIndex
CREATE INDEX "Voucher_rewardId_idx" ON "Voucher"("rewardId");

-- CreateIndex
CREATE INDEX "Voucher_status_idx" ON "Voucher"("status");

-- CreateIndex
CREATE INDEX "Voucher_expiresAt_idx" ON "Voucher"("expiresAt");

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "Reward"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_redemptionId_fkey" FOREIGN KEY ("redemptionId") REFERENCES "Redemption"("id") ON DELETE CASCADE ON UPDATE CASCADE;
