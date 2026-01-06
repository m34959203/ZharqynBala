-- Add optional metadata column to answer_options for storing category info
-- Used by career tests and other tests that need additional scoring metadata

ALTER TABLE "answer_options" ADD COLUMN IF NOT EXISTS "metadata" JSONB;
