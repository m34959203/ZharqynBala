-- Add token field for public access URL
ALTER TABLE "group_tests" ADD COLUMN "token" TEXT NOT NULL DEFAULT gen_random_uuid()::text;
CREATE UNIQUE INDEX "group_tests_token_key" ON "group_tests"("token");

-- Add results JSON field for storing student test results
ALTER TABLE "group_tests" ADD COLUMN "results" JSONB DEFAULT '[]';
