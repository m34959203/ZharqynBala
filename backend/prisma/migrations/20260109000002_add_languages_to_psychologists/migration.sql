-- Добавляем поле languages для хранения языков консультации
ALTER TABLE "psychologists" ADD COLUMN "languages" TEXT[] DEFAULT ARRAY['Русский']::TEXT[];
