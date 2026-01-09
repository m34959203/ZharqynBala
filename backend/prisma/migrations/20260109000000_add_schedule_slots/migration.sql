-- CreateTable
CREATE TABLE "schedule_slots" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "hour" INTEGER NOT NULL,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedule_slots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "schedule_slots_psychologist_id_idx" ON "schedule_slots"("psychologist_id");

-- CreateIndex
CREATE INDEX "schedule_slots_date_idx" ON "schedule_slots"("date");

-- CreateIndex
CREATE UNIQUE INDEX "schedule_slots_psychologist_id_date_hour_key" ON "schedule_slots"("psychologist_id", "date", "hour");

-- AddForeignKey
ALTER TABLE "schedule_slots" ADD CONSTRAINT "schedule_slots_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
