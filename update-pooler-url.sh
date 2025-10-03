#!/bin/bash

echo "🔧 Update Supabase Connection Pooler URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ -z "$1" ]; then
    echo "Usage: ./update-pooler-url.sh <region>"
    echo ""
    echo "Example:"
    echo "  ./update-pooler-url.sh aws-0-us-east-1"
    echo ""
    echo "Or paste the full connection string from Supabase dashboard:"
    echo "  ./update-pooler-url.sh 'postgresql://postgres.bykrhpaqaxhyfrqfvbus:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres'"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "To get the correct URL:"
    echo "1. Go to: https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/settings/database"
    echo "2. Look for 'Connection pooling' → 'Transaction' mode"
    echo "3. Copy the region part (e.g., aws-0-us-east-1)"
    echo ""
    exit 1
fi

ENV_FILE="apps/web/.env.local"
PASSWORD="Y%40seenH%40li2025"  # URL-encoded version of Y@seenH@li2025

# Extract region from input
INPUT="$1"
if [[ "$INPUT" == postgresql://* ]]; then
    # Full URL provided, extract region
    REGION=$(echo "$INPUT" | sed -n 's/.*@\([^.]*\.pooler\.supabase\.com\).*/\1/p' | cut -d'.' -f1)
else
    # Just region provided
    REGION="$INPUT"
fi

echo "Setting region to: $REGION"
echo ""

# Create the new DATABASE_URL
NEW_URL="postgresql://postgres.bykrhpaqaxhyfrqfvbus:${PASSWORD}@${REGION}.pooler.supabase.com:6543/postgres"

# Backup
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%s)"

# Update the file
sed -i "s|^DATABASE_URL=.*|DATABASE_URL=$NEW_URL|" "$ENV_FILE"

echo "✅ Updated $ENV_FILE"
echo ""
echo "New DATABASE_URL:"
echo "  $NEW_URL"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 Next steps:"
echo ""
echo "1. Restart your dev server:"
echo "   Ctrl+C (stop)"
echo "   npm run dev (start)"
echo ""
echo "2. Test: http://localhost:3000/po-mapping"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
