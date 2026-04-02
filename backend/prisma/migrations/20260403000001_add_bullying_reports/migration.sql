-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED');
CREATE TYPE "BullyingType" AS ENUM ('PHYSICAL', 'VERBAL', 'SOCIAL', 'CYBER', 'OTHER');

-- CreateTable
CREATE TABLE "bullying_reports" (
    "id" TEXT NOT NULL,
    "school_id" TEXT,
    "type" "BullyingType" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "anonymous" BOOLEAN NOT NULL DEFAULT true,
    "reporter_name" TEXT,
    "reporter_contact" TEXT,
    "victim_grade" INTEGER,
    "status" "ReportStatus" NOT NULL DEFAULT 'NEW',
    "resolution" TEXT,
    "assigned_to" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "bullying_reports_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "bullying_reports" ADD CONSTRAINT "bullying_reports_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
