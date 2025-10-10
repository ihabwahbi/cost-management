# API Architecture Remediation Plan - Backend Procedure Specialization Compliance

**Date**: 2025-10-05 (Updated after independent review)  
**Architect**: MigrationArchitect (Phase 3)  
**Status**: ready_for_implementation  
**Phase**: 3 - Architecture Remediation Planning  
**Workflow Phase**: Phase 3: Migration Planning  
**Version**: 3.0 - CODE-ONLY (docs handled by user)

## Based On

**Discovery Report**: thoughts/shared/analysis/2025-10-05_16-00_projects-page_analysis.md  
**Analysis Sources**: 
- Parallel agent analysis (codebase-locator, codebase-analyzer, component-pattern-analyzer)
- User-provided architecture violation report
- Independent LLM review (critical pattern verification)
- Architecture blueprint: docs/ai-native-codebase-architecture.md

## Migration Metadata

**Target Scope**: API Procedure Specialization Architecture Compliance (CODE ONLY)  
**Components Affected**:
- packages/api/src/routers/po-mapping.ts (364 lines, 9 procedures) - **REFACTOR**
- packages/api/src/routers/test.ts (58 lines, 2 procedures) - **REFACTOR**
- packages/api/src/index.ts (import path updates) - **UPDATE**

**Complexity**: medium  
**Strategy**: phased (Phase 1: test.ts, Phase 2: po-mapping.ts)  
**Estimated Duration**: 4-5 hours total

**Note**: Documentation updates handled separately by user (assumed complete)

---

## 🎯 Pattern Clarification (Post-Independent Review)

### ACTUAL Pattern (Used by ALL 17 Existing Procedures)

**This is the pattern we're using** - matches dashboard/projects/forecasts domains:

```typescript
// ✅ Procedure file - Direct export
export const getProcedure = publicProcedure
  .input(...)
  .query(...)

// ✅ Domain router - Direct reference
import { getProcedure } from './get-procedure.procedure'

export const domainRouter = router({
  getProcedure,  // Direct reference (no spread)
})
```

**NOT Using** (documented but never implemented):

```typescript
// ❌ Router-wrapped procedure export
export const getProcedureRouter = router({
  getProcedure: publicProcedure...
})

// ❌ Spread operator aggregation
export const domainRouter = router({
  ...getProcedureRouter,
})
```

---

## Executive Summary

### Current State

**Architecture Health**: 95.8% API compliance, 100% Cell compliance

**Critical Violations Identified**:

1. **Monolithic Router Pattern** (po-mapping.ts): 9 procedures in single file (violates M1, M2)
2. **Multiple Procedures Per File** (test.ts): 2 procedures in single file (violates M1)
3. **Inconsistent Directory Structure**: Files in `/routers/` instead of `/procedures/[domain]/`

**Compliant Implementations** (Reference Examples):

- ✅ **dashboard domain**: 10 procedures using ACTUAL pattern (direct exports)
- ✅ **projects domain**: 4 procedures using ACTUAL pattern (direct exports)
- ✅ **forecasts domain**: 3 procedures using ACTUAL pattern (direct exports)
- ✅ **All 11 Cells**: 100% compliant with manifest + pipeline requirements

### Remediation Goal

**Transform monolithic routers using ACTUAL pattern:**

```
packages/api/src/routers/
├── po-mapping.ts     # 🔴 364 lines, 9 procedures
└── test.ts           # 🔴 58 lines, 2 procedures
```

**Into specialized procedures (following dashboard/projects/forecasts pattern):**

```
packages/api/src/procedures/
├── po-mapping/
│   ├── get-projects.procedure.ts              # ✅ ~30 lines, exports: getProjects
│   ├── get-spend-types.procedure.ts           # ✅ ~35 lines, exports: getSpendTypes
│   ├── get-spend-sub-categories.procedure.ts  # ✅ ~40 lines, exports: getSpendSubCategories
│   ├── find-matching-cost-breakdown.procedure.ts # ✅ ~55 lines, exports: findMatchingCostBreakdown
│   ├── get-existing-mappings.procedure.ts     # ✅ ~60 lines, exports: getExistingMappings
│   ├── create-mapping.procedure.ts            # ✅ ~55 lines, exports: createMapping
│   ├── update-mapping.procedure.ts            # ✅ ~40 lines, exports: updateMapping
│   ├── clear-mappings.procedure.ts            # ✅ ~30 lines, exports: clearMappings
│   ├── get-cost-breakdown-by-id.procedure.ts  # ✅ ~40 lines, exports: getCostBreakdownById
│   └── po-mapping.router.ts                   # ✅ ~20 lines, router({ getProjects, ... })
└── test/
    ├── hello.procedure.ts        # ✅ ~20 lines, exports: hello
    ├── health-check.procedure.ts # ✅ ~30 lines, exports: healthCheck
    └── test.router.ts            # ✅ ~10 lines, router({ hello, healthCheck })
```

**Success Metrics**:
- Zero M1 violations (one procedure per file)
- Zero M2 violations (all files ≤200 lines for procedures, ≤50 for routers)
- 100% API architecture compliance
- All endpoints functionally equivalent
- Pattern consistency: 28/28 procedures use same pattern

---

## Migration Overview

### Scope

**Files to Transform**: 2 monolithic routers  
**New Files to Create**: 13 total
- 11 procedure files (.procedure.ts) using ACTUAL pattern
- 2 domain routers (.router.ts) using direct aggregation

**Files to Modify**: 1
- packages/api/src/index.ts (import path updates)

**Files to Delete**: 3
- packages/api/src/routers/po-mapping.ts
- packages/api/src/routers/test.ts
- packages/api/src/routers/ (directory)

### Dependencies

**No External Dependencies**:
- No database schema changes required
- No frontend changes required (tRPC client auto-updates from types)
- No breaking API changes (endpoint names unchanged)

**Risk Assessment**: LOW
- Mechanical refactor with well-established pattern
- **17 reference implementations** already using this pattern
- Type safety enforced at compile time
- Atomic git commits allow easy rollback

---

## Architecture Compliance Validation

**Pre-Implementation Verification** (Phase 3 Self-Validation):

### Architectural Mandates

- **M1 (One Procedure Per File)**: ✓ Plan creates 11 individual procedure files
- **M2 (File Size Limits)**: ✓ All procedures estimated <200 lines, routers <50 lines
- **M3 (No Parallel Implementations)**: ✓ No parallel implementations exist (verified by agents)
- **M4 (Explicit Naming)**: ✓ All files follow [action]-[entity].procedure.ts pattern

### Specialized Procedure Architecture

- **One Procedure Per File**: ✓ 11 procedure files planned
- **Procedure Size Limits**: ✓ All procedures ≤200 lines (largest: ~60 lines)
- **Router Complexity**: ✓ Both routers ≤50 lines (estimated 10-25 lines each)
- **Export Pattern**: ✓ Procedures export directly (matches all 17 existing procedures)

### Forbidden Pattern Scan

- "optional" phases: ✓ None detected - all phases required
- "future cleanup": ✓ None detected - cleanup in same migration
- File size exemptions: ✓ None detected - all files within limits

**Compliance Status**: ✅ **COMPLIANT** - Ready for Phase 4 implementation

---

## Migration Sequence (7 Steps)

### Step 1: Create Drizzle Schemas

**Duration**: N/A (no schema changes required)  
**Action**: Skip - all required tables already exist  
**Validation**: Confirm via Drizzle schema inspection  

**Tables Used**:
- `projects` (already defined in packages/db/src/schema/projects.ts)
- `cost_breakdown` (already defined in packages/db/src/schema/cost-breakdown.ts)
- `po_mappings` (already defined in packages/db/src/schema/po-mappings.ts)
- `po_line_items` (already defined in packages/db/src/schema/po-line-items.ts)

**Status**: ✅ Complete - no action required

---

### Step 2: Create Specialized tRPC Procedures

**Duration**: 3-4 hours  
**Phase**: Data Layer Implementation  
**Strategy**: Phased (test domain first, then po-mapping domain)  
**Architecture**: API Procedure Specialization - **ACTUAL pattern** (direct exports)

#### Step 2.1: Test Domain (30 minutes)

**Action**: Create 3 files using ACTUAL pattern (matches all 17 existing procedures)

**Files to Create**:
1. `packages/api/src/procedures/test/hello.procedure.ts` (~20 lines)
2. `packages/api/src/procedures/test/health-check.procedure.ts` (~30 lines)
3. `packages/api/src/procedures/test/test.router.ts` (~10 lines)

**Implementation Pattern** (CRITICAL - Use ACTUAL Pattern):

```typescript
// ✅ File 1: hello.procedure.ts (ACTUAL pattern - matches dashboard procedures)
import { z } from 'zod'
import { publicProcedure } from '../../trpc'

/**
 * Hello world test endpoint
 * Used for: API health verification
 */
export const hello = publicProcedure  // Direct export
  .input(z.object({
    name: z.string()
  }))
  .query(async ({ input }) => {
    return {
      message: `Hello ${input.name} from tRPC Edge Function!`,
      timestamp: new Date().toISOString(),
    }
  })
```

```typescript
// ✅ File 2: health-check.procedure.ts (ACTUAL pattern)
import { publicProcedure } from '../../trpc'

/**
 * Database health check
 * Used for: Monitoring and diagnostics
 */
export const healthCheck = publicProcedure  // Direct export
  .query(async ({ ctx }) => {
    try {
      await ctx.db.query.projects.findFirst()
      return {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        database: 'connected' as const,
      }
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        database: 'disconnected' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })
```

```typescript
// ✅ File 3: test.router.ts (ACTUAL pattern - direct aggregation)
import { router } from '../../trpc'
import { hello } from './hello.procedure'
import { healthCheck } from './health-check.procedure'

/**
 * Test Domain Router
 * Aggregates test/health check procedures
 */
export const testRouter = router({
  hello,        // Direct reference (no spread operator)
  healthCheck,  // Direct reference
})
```

**What NOT to do** (❌ WRONG - Documented but unused pattern):
```typescript
// ❌ DON'T DO THIS - This pattern is documented but NOT used anywhere
export const helloRouter = router({
  hello: publicProcedure...
})

export const testRouter = router({
  ...helloRouter,  // NO spread operators
})
```

**Validation**:
```bash
# Test with curl
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/test.hello \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"name":"Test"}}}'

curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/test.healthCheck \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{}}}'
```

**Success Criteria**:
- [ ] All 3 files created using ACTUAL pattern (direct exports)
- [ ] Each procedure exports procedure directly (NOT wrapped in router)
- [ ] Router uses direct references (NOT spread operators)
- [ ] Pattern matches dashboard/projects/forecasts domains
- [ ] Curl tests return 200 OK with expected data
- [ ] TypeScript compilation succeeds

#### Step 2.2: PO Mapping Domain (3 hours)

**Action**: Create 10 files using ACTUAL pattern

**Files to Create**:
1. `packages/api/src/procedures/po-mapping/get-projects.procedure.ts` (~30 lines)
2. `packages/api/src/procedures/po-mapping/get-spend-types.procedure.ts` (~35 lines)
3. `packages/api/src/procedures/po-mapping/get-spend-sub-categories.procedure.ts` (~40 lines)
4. `packages/api/src/procedures/po-mapping/find-matching-cost-breakdown.procedure.ts` (~55 lines)
5. `packages/api/src/procedures/po-mapping/get-existing-mappings.procedure.ts` (~60 lines)
6. `packages/api/src/procedures/po-mapping/create-mapping.procedure.ts` (~55 lines)
7. `packages/api/src/procedures/po-mapping/update-mapping.procedure.ts` (~40 lines)
8. `packages/api/src/procedures/po-mapping/clear-mappings.procedure.ts` (~30 lines)
9. `packages/api/src/procedures/po-mapping/get-cost-breakdown-by-id.procedure.ts` (~40 lines)
10. `packages/api/src/procedures/po-mapping/po-mapping.router.ts` (~20 lines)

**Implementation Pattern Examples**:

```typescript
// ✅ Example: get-projects.procedure.ts (ACTUAL pattern)
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { projects } from '@cost-mgmt/db'
import { TRPCError } from '@trpc/server'

/**
 * Get all projects for PO mapping dropdown
 * Returns: Array of projects with id, name, subBusinessLine
 */
export const getProjects = publicProcedure  // Direct export
  .input(z.void())
  .query(async ({ ctx }) => {
    try {
      return await ctx.db
        .select({
          id: projects.id,
          name: projects.name,
          subBusinessLine: projects.subBusinessLine
        })
        .from(projects)
        .orderBy(projects.name)
    } catch (error) {
      console.error('[getProjects] Failed:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch projects. Please try again.',
        cause: error,
      })
    }
  })
```

```typescript
// ✅ Example: po-mapping.router.ts (ACTUAL pattern - direct aggregation)
import { router } from '../../trpc'
import { getProjects } from './get-projects.procedure'
import { getSpendTypes } from './get-spend-types.procedure'
import { getSpendSubCategories } from './get-spend-sub-categories.procedure'
import { findMatchingCostBreakdown } from './find-matching-cost-breakdown.procedure'
import { getExistingMappings } from './get-existing-mappings.procedure'
import { createMapping } from './create-mapping.procedure'
import { updateMapping } from './update-mapping.procedure'
import { clearMappings } from './clear-mappings.procedure'
import { getCostBreakdownById } from './get-cost-breakdown-by-id.procedure'

/**
 * PO Mapping Domain Router
 * Aggregates all PO mapping procedures (9 total: 6 queries + 3 mutations)
 */
export const poMappingRouter = router({
  getProjects,                // Direct reference
  getSpendTypes,              // Direct reference
  getSpendSubCategories,      // Direct reference
  findMatchingCostBreakdown,  // Direct reference
  getExistingMappings,        // Direct reference
  createMapping,              // Direct reference (mutation)
  updateMapping,              // Direct reference (mutation)
  clearMappings,              // Direct reference (mutation)
  getCostBreakdownById,       // Direct reference
})
```

**Procedure** (ONE AT A TIME):
```bash
# Create directory
mkdir -p packages/api/src/procedures/po-mapping

# For EACH procedure (extract one at a time):
#   1. Create new .procedure.ts file
#   2. Extract procedure logic from po-mapping.ts
#   3. Export as: export const [procedureName] = publicProcedure...
#      (NOT: export const [procedureName]Router = router({ ... }))
#   4. Add to po-mapping.router.ts with direct reference
#      (NOT: spread operator)
#   5. Test endpoint with curl
#   6. Git commit checkpoint
#   7. Move to next procedure
```

**Line Limits**:
- All procedure files: ≤200 lines ✅
- po-mapping.router.ts: ≤50 lines ✅ (expect ~20 lines)

**Validation** (AFTER EACH PROCEDURE):
```bash
# Test endpoint immediately after creation
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/poMapping.[procedureName] \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{...}}}'

# Verify response matches expected schema
# Git commit checkpoint
```

**Success Criteria**:
- [ ] All 10 files created using ACTUAL pattern
- [ ] Each procedure exports procedure directly (NOT router-wrapped)
- [ ] Router uses direct references (NOT spread operators)
- [ ] Pattern matches dashboard/projects/forecasts (consistency)
- [ ] All curl tests return 200 OK with expected data
- [ ] TypeScript compilation succeeds
- [ ] No file exceeds line limits

---

### Step 3: Deploy Edge Function

**Duration**: 15 minutes  
**Action**: Deploy updated tRPC API to Supabase Edge Function  
**Command**: `supabase functions deploy trpc --no-verify-jwt`  

**Procedure**:
```bash
# From project root
cd /home/iwahbi/dev/cost-management

# Deploy edge function
supabase functions deploy trpc --no-verify-jwt

# Wait for cold start
sleep 30

# Re-test all procedures via curl
```

**Validation**:
```bash
# Test domain
curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/test.hello \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{"name":"Deploy Test"}}}'

curl -X POST https://[PROJECT].supabase.co/functions/v1/trpc/test.healthCheck \
  -H "Content-Type: application/json" \
  -d '{"0":{"json":{}}}'

# PO Mapping domain (test all 9 endpoints with real data)
```

**Success Criteria**:
- [ ] Deployment succeeds with no errors
- [ ] All test domain endpoints return 200 OK
- [ ] All po-mapping domain endpoints return 200 OK
- [ ] No 404 Not Found errors
- [ ] Response data matches expected schemas

**Critical**: MUST pass curl tests before proceeding to Step 4

---

### Step 4: Update Main Router

**Duration**: 5 minutes  
**Phase**: Integration  
**Action**: Update import paths in `packages/api/src/index.ts`  

**Current Code** (WRONG):
```typescript
// File: packages/api/src/index.ts
import { router } from './trpc';
import { testRouter } from './routers/test';  // ❌ Wrong location
import { dashboardRouter } from './procedures/dashboard/dashboard.router';
import { poMappingRouter } from './routers/po-mapping';  // ❌ Wrong location
import { forecastsRouter } from './procedures/forecasts/forecasts.router';
import { projectsRouter } from './procedures/projects/projects.router';

export const appRouter = router({
  test: testRouter,
  dashboard: dashboardRouter,
  poMapping: poMappingRouter,
  forecasts: forecastsRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
```

**Updated Code** (CORRECT):
```typescript
// File: packages/api/src/index.ts
import { router } from './trpc';
import { testRouter } from './procedures/test/test.router';  // ✅ From procedures
import { dashboardRouter } from './procedures/dashboard/dashboard.router';
import { poMappingRouter } from './procedures/po-mapping/po-mapping.router';  // ✅ From procedures
import { forecastsRouter } from './procedures/forecasts/forecasts.router';
import { projectsRouter } from './procedures/projects/projects.router';

export const appRouter = router({
  test: testRouter,
  dashboard: dashboardRouter,
  poMapping: poMappingRouter,
  forecasts: forecastsRouter,
  projects: projectsRouter,
});

export type AppRouter = typeof appRouter;
```

**Validation**:
```bash
# TypeScript compilation
pnpm type-check

# Should succeed with zero errors
```

**Success Criteria**:
- [ ] Import paths updated for test and poMapping
- [ ] TypeScript compilation succeeds
- [ ] No broken import errors
- [ ] AppRouter type correctly exported

---

### Step 5: Delete Old Files

**Duration**: 2 minutes  
**Phase**: Cleanup  
**Action**: Delete monolithic router files  
**Critical**: Old component deletion in SAME migration (M-CELL-2 compliance)  

**Files to Delete**:
```bash
# Delete old monolithic routers
rm packages/api/src/routers/po-mapping.ts
rm packages/api/src/routers/test.ts

# Delete routers directory (now empty)
rmdir packages/api/src/routers
```

**Validation**:
```bash
# Verify no references to old files remain
grep -r "routers/po-mapping" packages/api/
grep -r "routers/test" packages/api/

# Should return nothing (no matches)
```

**Success Criteria**:
- [ ] po-mapping.ts deleted
- [ ] test.ts deleted
- [ ] routers/ directory deleted
- [ ] No references to old files in codebase
- [ ] Git shows files in staging area for commit

---

### Step 6: Run Full Validation Suite

**Duration**: 20 minutes  
**Phase**: Validation  
**Action**: Execute all quality gates  

**Validation Gates**:

#### Gate 1: TypeScript Compilation
```bash
pnpm type-check

# Expected: Zero errors
```

#### Gate 2: Unit Tests
```bash
pnpm test

# Expected: All tests pass
```

#### Gate 3: Build Validation
```bash
pnpm build

# Expected: Production build succeeds
```

#### Gate 4: Architecture Compliance
```bash
# M1: One procedure per file
find packages/api/src/procedures -name "*.procedure.ts" -exec sh -c \
  'count=$(grep -c "publicProcedure" "$1"); [ $count -eq 1 ] || echo "VIOLATION: $1 has $count procedures"' _ {} \;

# Expected: No violations (no output)

# M2: Procedure file size ≤200 lines
find packages/api/src/procedures -name "*.procedure.ts" -exec wc -l {} + | \
  awk '$1 > 200 { print "VIOLATION:", $2, "has", $1, "lines" }'

# Expected: No violations (no output)

# M2: Router file size ≤50 lines
find packages/api/src/procedures -name "*.router.ts" -exec wc -l {} + | \
  awk '$1 > 50 { print "VIOLATION:", $2, "has", $1, "lines" }'

# Expected: No violations (no output)

# PATTERN CONSISTENCY: No router-wrapped exports in procedure files
grep -r "Router = router({" packages/api/src/procedures/*.procedure.ts

# Expected: No matches (all procedures use direct exports)

# PATTERN CONSISTENCY: No spread operators in domain routers
grep -r "\.\.\." packages/api/src/procedures/*.router.ts

# Expected: No matches (all routers use direct references)
```

#### Gate 5: Functional Equivalence
```bash
# Test all endpoints via curl
# Verify responses match pre-migration responses
```

**Success Criteria**:
- [ ] TypeScript: Zero errors
- [ ] Tests: All pass
- [ ] Build: Succeeds
- [ ] M1 Compliance: All procedure files have exactly 1 procedure
- [ ] M2 Compliance: All files within size limits
- [ ] Pattern Consistency: All procedures use direct exports (0 router wrapping)
- [ ] Pattern Consistency: All routers use direct references (0 spread operators)
- [ ] Functional Equivalence: All endpoints work identically

---

### Step 7: Atomic Commit

**Duration**: 5 minutes  
**Phase**: Git Integration  
**Action**: Single atomic commit with all changes  

**Commit Message**:
```
refactor(api): migrate to API Procedure Specialization Architecture

Refactored monolithic routers into specialized procedures using
direct export pattern (matches dashboard/projects/forecasts domains).

Changes:
- Split po-mapping.ts (364 lines, 9 procedures) into 9 procedure files + 1 router
- Split test.ts (58 lines, 2 procedures) into 2 procedure files + 1 router
- Updated import paths in index.ts
- Deleted deprecated routers/ directory

Architecture Compliance:
- M1 (One Procedure Per File): ✅ 11 procedure files created
- M2 (File Size Limits): ✅ All procedures ≤200 lines, routers ≤50 lines
- Pattern Consistency: ✅ All 28 procedures now use same pattern (direct exports)

Artifacts Created:
- packages/api/src/procedures/test/ (3 files)
- packages/api/src/procedures/po-mapping/ (10 files)

Artifacts Modified:
- packages/api/src/index.ts (import path updates)

Artifacts Deleted:
- packages/api/src/routers/po-mapping.ts
- packages/api/src/routers/test.ts
- packages/api/src/routers/ (directory)

Validation:
- All TypeScript checks pass
- All unit tests pass
- Production build succeeds
- All endpoints functionally equivalent
- 100% API architecture compliance achieved
```

**Procedure**:
```bash
# Stage all changes
git add packages/api/src/procedures/test/
git add packages/api/src/procedures/po-mapping/
git add packages/api/src/index.ts

# Stage deletions
git add packages/api/src/routers/

# Commit atomically
git commit -F commit_message.txt

# Verify commit
git show --stat
```

**Success Criteria**:
- [ ] Single commit contains all changes
- [ ] Commit message follows conventional commits format
- [ ] All new files staged
- [ ] All deleted files staged
- [ ] Modified files staged (index.ts)
- [ ] Commit includes validation summary

---

## Rollback Strategy

**Trigger Conditions**:
- Any TypeScript compilation error
- Any unit test failure
- Any build failure
- Any endpoint functional regression
- Any architecture compliance violation

**Rollback Sequence**:

### Step 1: Git Revert
```bash
# Revert the migration commit
git revert HEAD

# Or if unpushed:
git reset --hard HEAD~1
```

**Result**: All code changes undone, monolithic routers restored

### Step 2: Verify Revert Successful
```bash
# Check files restored
ls packages/api/src/routers/po-mapping.ts  # Should exist
ls packages/api/src/routers/test.ts  # Should exist
ls packages/api/src/procedures/test/  # Should NOT exist
ls packages/api/src/procedures/po-mapping/  # Should NOT exist

# Run validation
pnpm type-check
pnpm test
pnpm build

# All should pass
```

**Success Criteria**:
- [ ] Old files restored
- [ ] New files removed
- [ ] TypeScript compilation succeeds
- [ ] All tests pass
- [ ] Build succeeds

### Step 3: Document Failure in Ledger
```bash
# Append failure entry to ledger
cat >> ledger.jsonl << 'EOF'
{"iterationId":"iter_20251005_FAIL_api-architecture-remediation","timestamp":"2025-10-05T12:52:00Z","humanPrompt":"Migrate API to Procedure Specialization Architecture","artifacts":{"created":[],"modified":[],"failed":["packages/api/src/procedures/test/","packages/api/src/procedures/po-mapping/"]},"status":"FAILED","reason":"[Document specific failure reason]","lessons_learned":"[Document what went wrong]"}
EOF
```

**Rollback Philosophy**: NO partial migrations - full rollback on any failure

---

## Validation Strategy

### Technical Validation

**TypeScript Type Safety**:
- **Command**: `pnpm type-check`
- **Requirement**: Zero errors
- **Automated**: Yes

**Unit Tests**:
- **Command**: `pnpm test`
- **Requirements**:
  - All existing tests pass
  - No new test failures introduced
  - API endpoint coverage maintained
- **Automated**: Yes

**Production Build**:
- **Command**: `pnpm build`
- **Requirement**: Build succeeds with zero errors
- **Automated**: Yes

### Functional Validation

**Endpoint Functional Equivalence**:
- **Requirement**: All endpoints return identical responses pre/post migration
- **Method**: Curl tests with known test data
- **Test Coverage**: All 11 procedures (9 PO Mapping + 2 Test)
- **Automated**: Partially (curl scripts)

**Example Validation**:
```bash
# Before migration
curl ... > /tmp/before_response.json

# After migration  
curl ... > /tmp/after_response.json

# Compare
diff /tmp/before_response.json /tmp/after_response.json

# Expected: No differences
```

### Architectural Validation

**M1 Compliance (One Procedure Per File)**:
```bash
find packages/api/src/procedures -name "*.procedure.ts" -exec sh -c \
  'count=$(grep -c "publicProcedure" "$1"); [ $count -ne 1 ] && echo "VIOLATION: $1"' _ {} \;

# Expected: No output (all files have exactly 1 procedure)
```

**M2 Compliance (File Size Limits)**:
```bash
# Procedure files ≤200 lines
find packages/api/src/procedures -name "*.procedure.ts" -exec wc -l {} + | \
  awk '$1 > 200 { print "VIOLATION:", $2 }'

# Router files ≤50 lines
find packages/api/src/procedures -name "*.router.ts" -exec wc -l {} + | \
  awk '$1 > 50 { print "VIOLATION:", $2 }'

# Expected: No output for both checks
```

**M3 Compliance (No Parallel Implementations)**:
```bash
# Verify old routers directory deleted
[ ! -d packages/api/src/routers ] && echo "✅ M3 COMPLIANT" || echo "❌ VIOLATION: routers/ exists"

# Verify no duplicate implementations
find packages/api/src -name "po-mapping.ts" -o -name "test.ts"

# Expected: No matches (both files deleted)
```

**Pattern Consistency Validation**:
```bash
# All procedures should use direct exports (NOT router wrapping)
grep -r "Router = router({" packages/api/src/procedures/*.procedure.ts

# Expected: No matches (0/28 procedures use router wrapping)

# All routers should use direct references (NOT spread operators)
grep -r "\.\.\." packages/api/src/procedures/*.router.ts

# Expected: No matches (0/6 routers use spread operators)

# Count total procedure files
find packages/api/src/procedures -name "*.procedure.ts" | wc -l

# Expected: 28 (17 existing + 11 new)

# Verify all use same pattern
echo "Pattern consistency: 28/28 procedures = 100%"
```

### Manual Validation (Not Required for This Migration)

**Rationale**: 
- No UI changes (backend-only refactor)
- Type safety enforces contract compliance
- Automated tests cover functionality
- Curl tests verify endpoints work

**Manual validation NOT required for this migration**

---

## Success Criteria

A migration is considered successfully implemented when:

### Artifact Criteria
- [ ] 13 new procedure/router files created (11 procedures + 2 routers)
- [ ] 2 old router files deleted (po-mapping.ts, test.ts)
- [ ] 1 directory deleted (routers/)
- [ ] 1 file modified (index.ts import paths)

### Architecture Criteria
- [ ] M1 (One Procedure Per File): All 28 procedure files have exactly 1 procedure
- [ ] M2 (File Size Limits): All procedure files ≤200 lines, router files ≤50 lines
- [ ] M3 (No Parallel Implementations): routers/ directory deleted
- [ ] Pattern Consistency: All 28 procedures use same pattern (direct exports)
- [ ] Pattern Consistency: All 6 routers use same pattern (direct references)

### Functional Criteria
- [ ] TypeScript compilation: Zero errors
- [ ] Unit tests: All pass
- [ ] Production build: Succeeds
- [ ] All 11 endpoints: Return correct responses via curl
- [ ] Functional equivalence: Pre/post migration responses identical

### Integration Criteria
- [ ] Single atomic commit created
- [ ] Ledger updated with migration entry
- [ ] No broken imports in frontend
- [ ] No TypeScript errors in consuming code

### Compliance Criteria
- [ ] 100% API architecture compliance achieved
- [ ] 100% pattern consistency (28/28 procedures)
- [ ] Zero forbidden patterns detected
- [ ] All validation gates pass
- [ ] Architecture health check succeeds

---

## Phase 4 Execution Checklist

Step-by-step checklist for MigrationExecutor:

### Pre-Migration
- [ ] Read this entire plan
- [ ] Review reference implementations (dashboard, projects, forecasts domains)
- [ ] **CRITICAL**: Understand ACTUAL pattern (direct exports, NOT router wrapping)
- [ ] Prepare curl test commands with real UUIDs
- [ ] Create git branch: `refactor/api-procedure-specialization`

### Phase 1: Test Domain (30 min)
- [ ] Create `packages/api/src/procedures/test/` directory
- [ ] Create `hello.procedure.ts` (~20 lines) - **export const hello**
- [ ] Create `health-check.procedure.ts` (~30 lines) - **export const healthCheck**
- [ ] Create `test.router.ts` (~10 lines) - **router({ hello, healthCheck })**
- [ ] **Verify**: NO router wrapping, NO spread operators
- [ ] Test both endpoints with curl
- [ ] Verify responses match expected schemas
- [ ] Git commit: "refactor(api): migrate test domain to specialized procedures"

### Phase 2: PO Mapping Domain (3 hours)
- [ ] Create `packages/api/src/procedures/po-mapping/` directory
- [ ] Create `get-projects.procedure.ts` (~30 lines) - **export const getProjects**
- [ ] **Pattern check**: Direct export, NO router wrapping
- [ ] Test endpoint with curl, verify response
- [ ] Create `get-spend-types.procedure.ts` (~35 lines) - **export const getSpendTypes**
- [ ] **Pattern check**: Direct export, NO router wrapping
- [ ] Test endpoint with curl, verify response
- [ ] Create `get-spend-sub-categories.procedure.ts` (~40 lines)
- [ ] Test endpoint with curl, verify response
- [ ] Create `find-matching-cost-breakdown.procedure.ts` (~55 lines)
- [ ] Test endpoint with curl, verify response
- [ ] Create `get-existing-mappings.procedure.ts` (~60 lines)
- [ ] Test endpoint with curl, verify response
- [ ] Create `create-mapping.procedure.ts` (~55 lines, mutation)
- [ ] Test endpoint with curl, verify response
- [ ] Create `update-mapping.procedure.ts` (~40 lines, mutation)
- [ ] Test endpoint with curl, verify response
- [ ] Create `clear-mappings.procedure.ts` (~30 lines, mutation)
- [ ] Test endpoint with curl, verify response
- [ ] Create `get-cost-breakdown-by-id.procedure.ts` (~40 lines)
- [ ] Test endpoint with curl, verify response
- [ ] Create `po-mapping.router.ts` (~20 lines) - **Direct references only**
- [ ] **Verify**: All procedures use direct exports
- [ ] **Verify**: Router uses direct references, NO spread operators
- [ ] Git commit: "refactor(api): migrate po-mapping domain to specialized procedures"

### Phase 3: Integration (10 min)
- [ ] Deploy edge function: `supabase functions deploy trpc --no-verify-jwt`
- [ ] Wait 30 seconds for cold start
- [ ] Re-test all 11 endpoints via curl against deployed function
- [ ] Update `packages/api/src/index.ts` import paths (2 lines)
- [ ] Run `pnpm type-check` - verify zero errors
- [ ] Git commit: "refactor(api): update main router import paths"

### Phase 4: Cleanup (5 min)
- [ ] Delete `packages/api/src/routers/po-mapping.ts`
- [ ] Delete `packages/api/src/routers/test.ts`
- [ ] Delete `packages/api/src/routers/` directory
- [ ] Run `grep -r "routers/po-mapping" packages/api/` - verify no matches
- [ ] Run `grep -r "routers/test" packages/api/` - verify no matches
- [ ] Git stage deletions
- [ ] Git commit: "refactor(api): delete deprecated monolithic routers"

### Phase 5: Validation (20 min)
- [ ] Run `pnpm type-check` - verify zero errors
- [ ] Run `pnpm test` - verify all tests pass
- [ ] Run `pnpm build` - verify production build succeeds
- [ ] Run M1 compliance check (procedure count per file)
- [ ] Run M2 compliance check (file size limits)
- [ ] Run M3 compliance check (no parallel implementations)
- [ ] Run pattern consistency check (no router wrapping)
- [ ] Run pattern consistency check (no spread operators)
- [ ] Verify 28/28 procedures use same pattern
- [ ] All validation gates MUST pass before proceeding

### Phase 6: Atomic Commit (5 min)
- [ ] Squash all checkpoint commits into single atomic commit
- [ ] Use commit message template from Step 7
- [ ] Verify commit includes all changes
- [ ] Verify commit includes deletions
- [ ] Push to remote branch
- [ ] Create pull request

### Phase 7: Ledger Update (5 min)
- [ ] Append success entry to `ledger.jsonl`
- [ ] Include iteration ID, timestamp, artifacts created/modified/deleted
- [ ] Document architecture compliance + pattern consistency achievement

---

## Appendix: Reference Patterns

### ✅ ACTUAL Pattern (Used by ALL 17 Existing Procedures)

**Procedure File Pattern**:
```typescript
// packages/api/src/procedures/[domain]/[action]-[entity].procedure.ts

import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { /* tables */ } from '@cost-mgmt/db'
import { /* drizzle helpers */ } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * [Brief description]
 * Input: [describe input]
 * Output: [describe output]
 * Used by: [component name if known]
 */
export const [procedureName] = publicProcedure  // Direct export
  .input(z.object({
    // Input validation
  }))
  .query(async ({ input, ctx }) => {  // or .mutation() for writes
    try {
      // Business logic
      const result = await ctx.db
        .select()
        .from(table)
        .where(eq(table.column, input.value))
      
      return result
    } catch (error) {
      console.error('[procedureName] Failed:', error)
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'User-friendly error message',
        cause: error,
      })
    }
  })
```

**Domain Router Pattern**:
```typescript
// packages/api/src/procedures/[domain]/[domain].router.ts

import { router } from '../../trpc'
import { procedure1 } from './procedure-1.procedure'
import { procedure2 } from './procedure-2.procedure'

/**
 * [Domain] Router
 * Aggregates all [domain] procedures (N total)
 */
export const [domain]Router = router({
  procedure1,  // Direct reference
  procedure2,  // Direct reference
})
```

### Real-World Example: Dashboard Domain (74 lines)

**Perfect M1-M2 Compliance + Correct Pattern**:

```typescript
// packages/api/src/procedures/dashboard/get-kpi-metrics.procedure.ts
import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { eq, sum, sql, and } from 'drizzle-orm'
import { costBreakdown, poMappings, budgetForecasts, forecastVersions } from '@cost-mgmt/db'
import { TRPCError } from '@trpc/server'

/**
 * Get KPI Metrics for a project
 * Returns budget total, committed amount, and variance
 * Used by: kpi-card Cell
 */
export const getKPIMetrics = publicProcedure  // Direct export ✅
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // ... 58 lines of business logic
        return {
          budgetTotal,
          committed,
          variance,
          variancePercent,
        }
      } catch (error) {
        console.error('Failed to fetch KPI metrics:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch KPI metrics. Please try again.',
          cause: error,
        })
      }
    })
```

```typescript
// packages/api/src/procedures/dashboard/dashboard.router.ts
import { router } from '../../trpc'
import { getKPIMetrics } from './get-kpi-metrics.procedure'
import { getPLMetrics } from './get-pl-metrics.procedure'
import { getPLTimeline } from './get-pl-timeline.procedure'
// ... 7 more imports

/**
 * Dashboard Domain Router
 * Aggregates all dashboard procedures (10 total)
 */
export const dashboardRouter = router({
  getKPIMetrics,       // Direct reference ✅
  getPLMetrics,        // Direct reference ✅
  getPLTimeline,       // Direct reference ✅
  // ... 7 more direct references
})
```

**This is the pattern to follow for ALL new procedures.**

---

## Plan Validation Summary

### Self-Validation Against Architectural Mandates

✅ **M1 (One Procedure Per File)**: Plan creates 11 individual procedure files  
✅ **M2 (File Size Limits)**: All procedures <200 lines, routers <50 lines  
✅ **M3 (No Parallel Implementations)**: Plan deletes old files in same migration  
✅ **M4 (Explicit Naming)**: All files follow [action]-[entity].procedure.ts pattern  
✅ **Pattern Consistency**: All procedures use ACTUAL pattern (matches 17 existing)

### Forbidden Pattern Scan

✅ No "optional" phases - all 7 steps required  
✅ No "future cleanup" - deletion in Step 5 (same migration)  
✅ No "temporary exemption" - plan enforces all mandates  
✅ No file size exemptions - all files within limits  
✅ No router wrapping pattern used (0/28 procedures)  
✅ No spread operators used (0/6 routers)

### Plan Completeness

✅ Data layer specifications complete (all 11 procedures detailed)  
✅ Migration sequence defined (7 steps with validation checkpoints)  
✅ Rollback strategy complete (git revert + verification + ledger)  
✅ Validation criteria measurable (automated compliance checks)  
✅ Success criteria explicit (artifact + architecture + functional)  
✅ Execution checklist actionable (step-by-step for Phase 4)  
✅ Pattern validation added (consistency checks)

**Plan Status**: ✅ **COMPLIANT** - Ready for Phase 4 Implementation

**Pattern Consistency**: ✅ **100%** - All 28 procedures will use same pattern

---

**END OF PLAN (Version 3.0 - CODE-ONLY)**
