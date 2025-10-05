# Cost Breakdown Procedures - Curl Test Commands

**Date**: 2025-10-05  
**Phase**: Phase A (Data Layer) Complete  
**Status**: Ready for testing in Phase B

---

## Prerequisites

1. Next.js dev server running: `pnpm dev`
2. Valid project UUID with cost breakdown data

## Test Procedure 1: Get Cost Breakdown by Project

```bash
curl -X POST http://localhost:3000/api/trpc/costBreakdown.getCostBreakdownByProject \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "[REPLACE_WITH_REAL_UUID]",
    "orderBy": "costLine"
  }'
```

**Expected Response**: Array of cost breakdown entries with budgetCost as number

---

## Test Procedure 2: Get Cost Breakdown Baseline

```bash
curl -X POST http://localhost:3000/api/trpc/costBreakdown.getCostBreakdownBaseline \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "[REPLACE_WITH_REAL_UUID]",
    "minBudgetCost": 1000
  }'
```

**Expected Response**: Array of cost breakdown entries filtered by minimum budget

---

## Test Procedure 3: Create Cost Entry

```bash
curl -X POST http://localhost:3000/api/trpc/costBreakdown.createCostEntry \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "[REPLACE_WITH_REAL_UUID]",
    "subBusinessLine": "Test SBL",
    "costLine": "Test Cost Line",
    "spendType": "Capex",
    "spendSubCategory": "Equipment",
    "budgetCost": 50000
  }'
```

**Expected Response**: Created entry with generated UUID

---

## Test Procedure 4: Update Cost Entry

```bash
curl -X POST http://localhost:3000/api/trpc/costBreakdown.updateCostEntry \
  -H "Content-Type: application/json" \
  -d '{
    "id": "[REPLACE_WITH_COST_ENTRY_UUID]",
    "budgetCost": 55000,
    "costLine": "Updated Cost Line"
  }'
```

**Expected Response**: Updated entry with new values

---

## Test Procedure 5: Delete Cost Entry

```bash
curl -X POST http://localhost:3000/api/trpc/costBreakdown.deleteCostEntry \
  -H "Content-Type: application/json" \
  -d '{
    "id": "[REPLACE_WITH_COST_ENTRY_UUID]"
  }'
```

**Expected Response**: `{ "success": true, "deletedId": "..." }`

---

## Test Procedure 6: Bulk Delete Cost Entries

```bash
curl -X POST http://localhost:3000/api/trpc/costBreakdown.bulkDeleteCostEntries \
  -H "Content-Type: application/json" \
  -d '{
    "ids": [
      "[REPLACE_WITH_UUID_1]",
      "[REPLACE_WITH_UUID_2]",
      "[REPLACE_WITH_UUID_3]"
    ]
  }'
```

**Expected Response**: `{ "success": true, "deletedCount": 3, "deletedIds": [...] }`

---

## Validation Checklist

Phase A procedures created and validated:
- [x] All 6 procedures created
- [x] Type-check passed
- [x] M1-M4 architecture compliance verified
- [x] Main app router updated
- [ ] Curl tests executed (to be done in Phase B with test data)

**Note**: Actual curl testing will be performed in Phase B when Cell component is created and real/mock data is available.
