-- AlterEnum - Добавляем новые статусы консультаций
-- Сначала создаём временный тип
CREATE TYPE "ConsultationStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');

-- Обновляем существующие записи (маппинг старых статусов на новые)
UPDATE "consultations" SET "status" = 'PENDING'::"ConsultationStatus" WHERE "status" = 'SCHEDULED'::"ConsultationStatus";

-- Изменяем колонку на новый тип
ALTER TABLE "consultations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "consultations" ALTER COLUMN "status" TYPE "ConsultationStatus_new" USING (
  CASE
    WHEN "status"::text = 'SCHEDULED' THEN 'PENDING'
    WHEN "status"::text = 'COMPLETED' THEN 'COMPLETED'
    WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'
    ELSE "status"::text
  END
)::"ConsultationStatus_new";

-- Удаляем старый тип и переименовываем новый
DROP TYPE "ConsultationStatus";
ALTER TYPE "ConsultationStatus_new" RENAME TO "ConsultationStatus";

-- Устанавливаем default
ALTER TABLE "consultations" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ConsultationStatus";

-- CreateEnum для PaymentStatus (для консультаций)
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- Переименовываем старый PaymentStatus в TransactionStatus
ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');

-- Обновляем таблицу payments
ALTER TABLE "payments" ALTER COLUMN "status" TYPE "TransactionStatus" USING (
  CASE
    WHEN "status"::text = 'PENDING' THEN 'PENDING'
    WHEN "status"::text = 'COMPLETED' THEN 'COMPLETED'
    WHEN "status"::text = 'FAILED' THEN 'FAILED'
    WHEN "status"::text = 'REFUNDED' THEN 'REFUNDED'
    ELSE 'PENDING'
  END
)::"TransactionStatus";

DROP TYPE "PaymentStatus_old";

-- Создаём новый PaymentStatus для консультаций
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');

-- Переименовываем parent_id в client_id
ALTER TABLE "consultations" RENAME COLUMN "parent_id" TO "client_id";

-- Делаем child_id nullable
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_child_id_fkey";
ALTER TABLE "consultations" ALTER COLUMN "child_id" DROP NOT NULL;

-- Добавляем новые колонки
ALTER TABLE "consultations" ADD COLUMN "room_name" TEXT;
ALTER TABLE "consultations" ADD COLUMN "room_url" TEXT;
ALTER TABLE "consultations" ADD COLUMN "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "consultations" ADD COLUMN "payment_id" TEXT;
ALTER TABLE "consultations" ADD COLUMN "cancel_reason" TEXT;
ALTER TABLE "consultations" ADD COLUMN "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Меняем meeting_url на room_url (удаляем старую колонку)
ALTER TABLE "consultations" DROP COLUMN IF EXISTS "meeting_url";

-- Изменяем duration_minutes default
ALTER TABLE "consultations" ALTER COLUMN "duration_minutes" SET DEFAULT 50;

-- Добавляем внешние ключи
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_child_id_fkey" FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Создаём индексы
CREATE INDEX "consultations_client_id_idx" ON "consultations"("client_id");
CREATE INDEX "consultations_status_idx" ON "consultations"("status");
CREATE INDEX "consultations_scheduled_at_idx" ON "consultations"("scheduled_at");
