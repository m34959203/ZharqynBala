-- CreateTable
CREATE TABLE "patient_notes" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "child_id" TEXT,
    "consultation_id" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chief_complaint" TEXT,
    "history_of_illness" TEXT,
    "mental_status" TEXT,
    "diagnosis" TEXT,
    "recommendations" TEXT,
    "treatment_plan" TEXT,
    "additional_data" JSONB,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patient_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "patient_notes_psychologist_id_idx" ON "patient_notes"("psychologist_id");

-- CreateIndex
CREATE INDEX "patient_notes_client_id_idx" ON "patient_notes"("client_id");

-- CreateIndex
CREATE INDEX "patient_notes_consultation_id_idx" ON "patient_notes"("consultation_id");

-- AddForeignKey
ALTER TABLE "patient_notes" ADD CONSTRAINT "patient_notes_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_notes" ADD CONSTRAINT "patient_notes_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_notes" ADD CONSTRAINT "patient_notes_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patient_notes" ADD CONSTRAINT "patient_notes_consultation_id_fkey" FOREIGN KEY ("consultation_id") REFERENCES "consultations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
