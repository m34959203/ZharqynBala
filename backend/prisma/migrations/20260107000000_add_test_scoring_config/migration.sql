-- AlterTable
ALTER TABLE "tests" ADD COLUMN "scoring_type" TEXT NOT NULL DEFAULT 'percentage';
ALTER TABLE "tests" ADD COLUMN "interpretation_config" JSONB;
