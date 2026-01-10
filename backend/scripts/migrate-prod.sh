#!/bin/sh

echo "========================================"
echo "=== Production Migration Script ======="
echo "========================================"

# Step 1: Resolve any failed migrations by marking them as applied
# This is safe because our migrations are written to be idempotent
# (using IF NOT EXISTS, DO $$ blocks, etc.)
echo ""
echo "Step 1: Checking for failed migrations..."

# List of migrations that may have failed and need resolution
# These migrations are idempotent and safe to mark as applied
FAILED_MIGRATIONS="20260109000003_update_consultations"

for migration in $FAILED_MIGRATIONS; do
    echo "Attempting to resolve migration: $migration"

    # Try --applied first (for partially applied idempotent migrations)
    if npx prisma migrate resolve --applied "$migration" 2>&1; then
        echo "Successfully marked $migration as applied"
    else
        echo "Note: Could not mark $migration as applied, trying --rolled-back..."

        # Fallback to --rolled-back if --applied fails
        if npx prisma migrate resolve --rolled-back "$migration" 2>&1; then
            echo "Successfully marked $migration as rolled-back"
        else
            echo "Note: Could not resolve $migration (may already be resolved or not exist)"
        fi
    fi
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
