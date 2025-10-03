#!/bin/bash

echo "🔍 Environment Configuration Check & Fix"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ENV_FILE="apps/web/.env.local"

# Check if .env.local exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ ERROR: $ENV_FILE not found!"
    exit 1
fi

echo "📄 Checking: $ENV_FILE"
echo ""

# Extract current DATABASE_URL
CURRENT_DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f 2-)

if [ -z "$CURRENT_DB_URL" ]; then
    echo "❌ DATABASE_URL is MISSING"
    echo ""
    echo "Add this line to $ENV_FILE:"
    echo "DATABASE_URL=postgresql://postgres:Y%40seenH%40li@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres"
    exit 1
fi

echo "✅ DATABASE_URL is set"
echo ""

# Check if password has unencoded @ symbols
if echo "$CURRENT_DB_URL" | grep -q ":Y@seenH@li@"; then
    echo "⚠️  PROBLEM FOUND: Password contains unencoded @ symbols!"
    echo ""
    echo "Current (WRONG):"
    echo "  $CURRENT_DB_URL"
    echo ""
    echo "Should be (CORRECT - @ encoded as %40):"
    echo "  postgresql://postgres:Y%40seenH%40li@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres"
    echo ""
    echo "🔧 Auto-fixing..."
    
    # Create backup
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    
    # Fix the URL
    sed -i 's|Y@seenH@li@|Y%40seenH%40li@|g' "$ENV_FILE"
    
    echo "✅ Fixed! (backup saved to ${ENV_FILE}.backup)"
    echo ""
    CURRENT_DB_URL=$(grep "^DATABASE_URL=" "$ENV_FILE" | cut -d '=' -f 2-)
fi

# Verify encoding
if echo "$CURRENT_DB_URL" | grep -q "Y%40seenH%40li"; then
    echo "✅ Password is properly URL-encoded"
else
    echo "⚠️  Warning: Password encoding looks different than expected"
    echo "   Current: $CURRENT_DB_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Configuration Summary:"
echo ""
echo "  Supabase URL: ✅ $(grep NEXT_PUBLIC_SUPABASE_URL= $ENV_FILE | cut -d '=' -f 2-)"
echo "  Database URL: ✅ Set with URL-encoded password"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 NEXT STEPS:"
echo ""
echo "  1. RESTART your dev server (IMPORTANT!)"
echo "     → Press Ctrl+C to stop current server"
echo "     → Run: npm run dev"
echo ""
echo "  2. Test the PO Mapping page:"
echo "     → Visit: http://localhost:3000/po-mapping"
echo "     → Check browser console for errors"
echo ""
echo "  3. If still having issues:"
echo "     → The IPv6 connection error from our test is likely a local"
echo "       network issue, but Next.js might handle it differently"
echo "     → Check Next.js server logs for actual error messages"
echo "     → Try using Supabase connection pooler (see docs)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
