#!/bin/bash
PROJECT_ID="94d1eaad-4ada-4fb6-b872-212b6cd6007a"
BASE_URL="http://localhost:3000/api/trpc"

echo "Phase 4 - Procedure Testing"
echo "============================"

# Test 1: getForecastDataEnhanced - Latest
echo -e "\n[TEST 1] getForecastDataEnhanced - Latest"
curl -s -X GET "${BASE_URL}/forecasts.getForecastDataEnhanced?batch=1&input=%7B%220%22%3A%7B%22projectId%22%3A%22${PROJECT_ID}%22%2C%22versionNumber%22%3A%22latest%22%7D%7D" | jq -r '.[0].result | if has("data") then "✅ 200 OK - \(.data | length) items" else "❌ ERROR" end'

# Test 2: getForecastDataEnhanced - v0
echo "[TEST 2] getForecastDataEnhanced - Version 0"
curl -s -X GET "${BASE_URL}/forecasts.getForecastDataEnhanced?batch=1&input=%7B%220%22%3A%7B%22projectId%22%3A%22${PROJECT_ID}%22%2C%22versionNumber%22%3A0%7D%7D" | jq -r '.[0].result | if has("data") then "✅ 200 OK - \(.data | length) items" else "❌ ERROR" end'

# Test 3: getComparisonData
echo "[TEST 3] getComparisonData - v0 vs v2"
curl -s -X GET "${BASE_URL}/forecasts.getComparisonData?batch=1&input=%7B%220%22%3A%7B%22projectId%22%3A%22${PROJECT_ID}%22%2C%22version1%22%3A0%2C%22version2%22%3A2%7D%7D" | jq -r '.[0].result | if has("data") then "✅ 200 OK - v1:\(.data.version1.items|length) v2:\(.data.version2.items|length) orig:\(.data.originalCostBreakdown|length)" else "⚠️ Versions may not exist" end'

# Test 4: deleteForecastVersion - v0 validation
echo "[TEST 4] deleteForecastVersion - v0 block"
curl -s -X POST "${BASE_URL}/forecasts.deleteForecastVersion?batch=1" -H 'Content-Type: application/json' -d '{"0":{"json":{"projectId":"'${PROJECT_ID}'","versionNumber":0}}}' | jq -r '.[0].error.message // "No error"' | head -c 80

echo -e "\n\n✅ All curl tests complete"
