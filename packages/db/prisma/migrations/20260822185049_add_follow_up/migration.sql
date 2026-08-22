-- CreateEnum
CREATE TYPE "CompanyRiskLevel" AS ENUM ('NEW', 'STEADY', 'DUE', 'OVERDUE', 'DORMANT');

-- AlterTable
ALTER TABLE "appSetting" ADD COLUMN     "followUp" JSONB;

-- AlterTable
ALTER TABLE "company" ADD COLUMN     "cycleOverdueDays" INTEGER,
ADD COLUMN     "lastPurchaseAt" TIMESTAMP(3),
ADD COLUMN     "purchaseCycleDays" INTEGER,
ADD COLUMN     "riskComputedAt" TIMESTAMP(3),
ADD COLUMN     "riskLevel" "CompanyRiskLevel" NOT NULL DEFAULT 'NEW';
