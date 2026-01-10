#!/bin/sh
set -e

echo "========================================"
echo "=== Production Migration Script ======="
echo "========================================"

# Step 1: Try to resolve any failed migrations
echo ""
echo "Step 1: Checking for failed migrations..."
echo "Attempting to mark migration as rolled-back..."

npx prisma migrate resolve --rolled-back 20260109000003_update_consultations 2>&1 || {
    echo "Note: Could not roll back migration (may already be resolved or not exist)"
}

# Step 2: Run migrations
echo ""
echo "Step 2: Running prisma migrate deploy..."
npx prisma migrate deploy

echo ""
echo "========================================"
echo "=== Migration completed successfully ==="
echo "========================================"
