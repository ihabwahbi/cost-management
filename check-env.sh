#!/bin/bash

echo "🔍 Environment Variables Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

ENV_FILE="apps/web/.env.local"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE not found!"
    exit 1
fi

echo "📄 Checking: $ENV_FILE"
echo ""

# Check each required env var
VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "DATABASE_URL")

for VAR in "${VARS[@]}"; do
    if grep -q "^${VAR}=" "$ENV_FILE"; then
        echo "✅ $VAR is set"
    else
        echo "❌ $VAR is MISSING"
        
        if [ "$VAR" == "DATABASE_URL" ]; then
            echo ""
            echo "   💡 To fix, add this to $ENV_FILE:"
            echo "   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres"
            echo ""
            echo "   Get YOUR_PASSWORD from:"
            echo "   https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/settings/database"
        fi
    fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
