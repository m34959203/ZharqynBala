-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "scheduled_events" (
    "id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "class_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quarter" INTEGER,
    "academic_year" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'PLANNED',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "scheduled_events_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "scheduled_events" ADD CONSTRAINT "scheduled_events_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "school_classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
