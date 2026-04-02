-- CreateEnum
CREATE TYPE "RiskZone" AS ENUM ('GREEN', 'YELLOW', 'RED');

-- AlterTable
ALTER TABLE "results" ADD COLUMN "risk_zone" "RiskZone" NOT NULL DEFAULT 'GREEN';
