-- Идемпотентная миграция для обновления консультаций
-- Использует DO блоки для безопасного выполнения

-- 1. Обновляем ConsultationStatus enum
DO $$
BEGIN
    -- Создаём новый enum если его нет
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationStatus_new') THEN
        CREATE TYPE "ConsultationStatus_new" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
    END IF;
END $$;

-- Проверяем нужно ли обновлять колонку status
DO $$
BEGIN
    -- Проверяем что колонка использует старый тип (если есть SCHEDULED)
    IF EXISTS (
        SELECT 1 FROM pg_enum e
        JOIN pg_type t ON e.enumtypid = t.oid
        WHERE t.typname = 'ConsultationStatus' AND e.enumlabel = 'SCHEDULED'
    ) THEN
        ALTER TABLE "consultations" ALTER COLUMN "status" DROP DEFAULT;
        ALTER TABLE "consultations" ALTER COLUMN "status" TYPE "ConsultationStatus_new" USING (
            CASE
                WHEN "status"::text = 'SCHEDULED' THEN 'PENDING'
                WHEN "status"::text = 'COMPLETED' THEN 'COMPLETED'
                WHEN "status"::text = 'CANCELLED' THEN 'CANCELLED'
                ELSE "status"::text
            END
        )::"ConsultationStatus_new";

        DROP TYPE "ConsultationStatus";
        ALTER TYPE "ConsultationStatus_new" RENAME TO "ConsultationStatus";
        ALTER TABLE "consultations" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"ConsultationStatus";
    END IF;
END $$;

-- Cleanup: удаляем ConsultationStatus_new если остался
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ConsultationStatus_new') THEN
        DROP TYPE IF EXISTS "ConsultationStatus_new";
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 2. Создаём TransactionStatus из старого PaymentStatus
DO $$
BEGIN
    -- Если PaymentStatus существует и TransactionStatus нет - переименовываем
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus')
       AND NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionStatus') THEN
        ALTER TYPE "PaymentStatus" RENAME TO "TransactionStatus";
    END IF;

    -- Создаём TransactionStatus если его нет
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'TransactionStatus') THEN
        CREATE TYPE "TransactionStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED');
    END IF;
END $$;

-- 3. Создаём новый PaymentStatus для консультаций
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentStatus') THEN
        CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED');
    END IF;
END $$;

-- 4. Переименовываем parent_id в client_id
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'parent_id') THEN
        ALTER TABLE "consultations" RENAME COLUMN "parent_id" TO "client_id";
    END IF;
END $$;

-- 5. Делаем child_id nullable
ALTER TABLE "consultations" DROP CONSTRAINT IF EXISTS "consultations_child_id_fkey";
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'consultations' AND column_name = 'child_id' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE "consultations" ALTER COLUMN "child_id" DROP NOT NULL;
    END IF;
END $$;

-- 6. Добавляем новые колонки (IF NOT EXISTS)
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "room_name" TEXT;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "room_url" TEXT;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'consultations' AND column_name = 'payment_status') THEN
        ALTER TABLE "consultations" ADD COLUMN "payment_status" "PaymentStatus" NOT NULL DEFAULT 'PENDING';
    END IF;
END $$;

ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "payment_id" TEXT;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "cancel_reason" TEXT;
ALTER TABLE "consultations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- 7. Удаляем meeting_url если есть
ALTER TABLE "consultations" DROP COLUMN IF EXISTS "meeting_url";

-- 8. Изменяем default для duration_minutes
ALTER TABLE "consultations" ALTER COLUMN "duration_minutes" SET DEFAULT 50;

-- 9. Добавляем внешние ключи (с проверкой)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultations_client_id_fkey') THEN
        ALTER TABLE "consultations" ADD CONSTRAINT "consultations_client_id_fkey"
            FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'consultations_child_id_fkey') THEN
        ALTER TABLE "consultations" ADD CONSTRAINT "consultations_child_id_fkey"
            FOREIGN KEY ("child_id") REFERENCES "children"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- 10. Создаём индексы
CREATE INDEX IF NOT EXISTS "consultations_client_id_idx" ON "consultations"("client_id");
CREATE INDEX IF NOT EXISTS "consultations_status_idx" ON "consultations"("status");
CREATE INDEX IF NOT EXISTS "consultations_scheduled_at_idx" ON "consultations"("scheduled_at");
