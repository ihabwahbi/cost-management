#!/bin/bash

# tRPC Edge Function Deployment Test Script
# Tests the deployed tRPC Edge Function endpoints

BASE_URL="https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc"

echo "🧪 Testing tRPC Edge Function Deployment"
echo "========================================="
echo ""

# Test 1: Health Check
echo "📊 Test 1: Health Check"
echo "Endpoint: ${BASE_URL}/test.healthCheck"
echo ""

HEALTH_RESPONSE=$(curl -s "${BASE_URL}/test.healthCheck")
echo "Response: ${HEALTH_RESPONSE}"
echo ""

if echo "$HEALTH_RESPONSE" | grep -q '"status":"healthy"'; then
  echo "✅ Health check PASSED"
else
  echo "❌ Health check FAILED"
fi
echo ""
echo "---"
echo ""

# Test 2: Hello World
echo "📊 Test 2: Hello World"
HELLO_INPUT='{"json":{"name":"Test"}}'
ENCODED_INPUT=$(echo -n "$HELLO_INPUT" | jq -sRr @uri)
echo "Endpoint: ${BASE_URL}/test.hello"
echo ""

HELLO_RESPONSE=$(curl -s "${BASE_URL}/test.hello?input=${ENCODED_INPUT}")
echo "Response: ${HELLO_RESPONSE}"
echo ""

if echo "$HELLO_RESPONSE" | grep -q '"message":"Hello Test!"'; then
  echo "✅ Hello test PASSED"
else
  echo "❌ Hello test FAILED"
fi
echo ""
echo "---"
echo ""

# Test 3: KPI Metrics (requires valid project UUID)
echo "📊 Test 3: KPI Metrics"
echo "⚠️  This test requires a valid project UUID"
echo ""

# Check if project UUID is provided as argument
if [ -n "$1" ]; then
  PROJECT_ID="$1"
  echo "Using project ID: ${PROJECT_ID}"
  
  KPI_INPUT="{\"json\":{\"projectId\":\"${PROJECT_ID}\"}}"
  ENCODED_KPI_INPUT=$(echo -n "$KPI_INPUT" | jq -sRr @uri)
  echo "Endpoint: ${BASE_URL}/dashboard.getKPIMetrics"
  echo ""
  
  KPI_RESPONSE=$(curl -s "${BASE_URL}/dashboard.getKPIMetrics?input=${ENCODED_KPI_INPUT}")
  echo "Response: ${KPI_RESPONSE}"
  echo ""
  
  if echo "$KPI_RESPONSE" | grep -q '"budgetTotal"'; then
    echo "✅ KPI metrics test PASSED"
  else
    echo "❌ KPI metrics test FAILED"
  fi
else
  echo "⏩ Skipping (no project UUID provided)"
  echo "   To test: ./test-deployment.sh <PROJECT-UUID>"
fi

echo ""
echo "========================================="
echo "🏁 Tests complete!"
echo ""
echo "Next steps:"
echo "1. If health check passed: Edge Function is deployed correctly"
echo "2. If all tests passed: Enable feature flag in .env.local"
echo "3. Set: NEXT_PUBLIC_FEATURE_KPI_CARD_V2=enabled"
echo "4. Restart: npm run dev"
