-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('DIAGNOSTIC', 'CONSULTATION', 'CORRECTION', 'EDUCATION', 'METHODOLOGY', 'OTHER');

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "school_id" TEXT,
    "type" "ActivityType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "class_grade" INTEGER,
    "class_letter" TEXT,
    "students_count" INTEGER,
    "duration" INTEGER,
    "result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
