#!/bin/sh

echo "========================================"
echo "=== Production Migration Script ======="
echo "========================================"

# Step 1: Remove any failed/rolled-back migration records directly from database
# This is necessary because:
# - prisma migrate resolve --applied only works for "failed" state
# - prisma migrate resolve --rolled-back only works for "failed" state
# - If migration is already rolled-back, Prisma will try to re-apply it and fail
# - Since our migrations are idempotent, we can safely let Prisma re-apply them
echo ""
echo "Step 1: Cleaning up failed migration records..."

# List of problematic migrations to clean up
PROBLEMATIC_MIGRATIONS="20260109000003_update_consultations"

for migration in $PROBLEMATIC_MIGRATIONS; do
    echo "Removing record for migration: $migration (if failed or rolled-back)"

    # Delete the migration record if it's in failed or rolled-back state
    # This allows Prisma to re-apply the idempotent migration cleanly
    echo "DELETE FROM \"_prisma_migrations\" WHERE \"migration_name\" = '$migration' AND (\"rolled_back_at\" IS NOT NULL OR \"finished_at\" IS NULL);" | npx prisma db execute --stdin 2>&1 || {
        echo "Note: Could not clean up migration record (table may not exist yet)"
    }
done

# Step 2: Run migrations (this MUST succeed)
echo ""
echo "Step 2: Running prisma migrate deploy..."
set -e
npx prisma migrate deploy

echo ""
echo "========================================"
echo "=== Migration completed successfully ==="
echo "========================================"
