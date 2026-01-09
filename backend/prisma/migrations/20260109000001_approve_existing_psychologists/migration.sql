-- Одобряем всех существующих психологов для отображения в списке
UPDATE "psychologists" SET "is_approved" = true WHERE "is_approved" = false;
