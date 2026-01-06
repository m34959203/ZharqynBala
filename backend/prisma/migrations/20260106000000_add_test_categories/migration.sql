-- Add new values to TestCategory enum
-- These are required for psychological tests that categorize social and cognitive assessments

ALTER TYPE "TestCategory" ADD VALUE IF NOT EXISTS 'SOCIAL';
ALTER TYPE "TestCategory" ADD VALUE IF NOT EXISTS 'COGNITIVE';
