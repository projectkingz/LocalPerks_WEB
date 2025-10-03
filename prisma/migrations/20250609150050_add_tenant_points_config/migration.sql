-- CreateTable
CREATE TABLE "TenantPointsConfig" (
    "id" TEXT NOT NULL,
    "config" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantPointsConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantPointsConfig_tenantId_key" ON "TenantPointsConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantPointsConfig" ADD CONSTRAINT "TenantPointsConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
