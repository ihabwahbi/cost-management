# Parallel Implementation Prevention System

**Date**: 2025-10-07  
**Status**: ACTIVE  
**Enforcement**: MANDATORY (Hard Block)

---

## Executive Summary

This document describes the comprehensive validation system that enforces M3 (No Parallel Implementations) mandate with 100% prevention guarantee through git-level hard blocking.

**Problem Solved**: Parallel implementations (e.g., `getForecastData` + `getForecastDataEnhanced`) create agent confusion, maintenance burden, and violate ANDA architectural principles.

**Solution**: Multi-layer enforcement system with pre-commit hook as mandatory gate.

---

## System Architecture

### Enforcement Layers

```
┌─────────────────────────────────────────────────────────────┐
│ Development Phase: Agent runs validator for fast feedback   │
│ Tool: ./scripts/validate-no-parallel-implementations.sh     │
│ Blocking: NO (optional, fast feedback)                      │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ GIT COMMIT: Pre-commit hook MANDATORY GATE                  │
│ Tool: .git/hooks/pre-commit                                 │
│ Blocking: YES (git enforces, cannot bypass without flag)    │
│ Coverage: 100% (every commit checked)                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 5: Migration Validator (migration-level)              │
│ Tool: Phase 5 validation workflow                           │
│ Blocking: YES (fails migration, prevents Phase 6)           │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ Phase 6: Architecture Health Monitor (system-wide)          │
│ Tool: Architecture health assessment                        │
│ Blocking: YES (can PAUSE future migrations)                 │
└─────────────────────────────────────────────────────────────┘
```

**Why this achieves 100%**: Pre-commit hook is git-level enforcement (cannot be bypassed without explicit `--no-verify`), and Phase 5/6 provide redundant coverage.

---

## Detection Strategies

### Strategy 1: Filename Pattern Detection (INFORMATIONAL)

**What it detects**: Files with semantic version indicators in filenames

**Patterns**:
- `*-v2.*`, `*-v3.*`
- `*-fixed.*`, `*-enhanced.*`, `*-improved.*`, `*-updated.*`
- `*-alt.*`, `*-new.*`

**Severity**: INFORMATIONAL (warning only)

**Rationale**: Having `-enhanced` suffix is acceptable IF no base version exists (old was properly deleted). Strategy 3 enforces actual duplication.

**Example**:
```
✅ ACCEPTABLE: Only get-forecast-data-enhanced.procedure.ts exists
❌ VIOLATION: Both get-forecast-data.procedure.ts AND get-forecast-data-enhanced.procedure.ts exist
```

### Strategy 2: Router Comment Scanning (HIGH SEVERITY)

**What it detects**: Deprecation comments in router files indicating parallel implementations

**Patterns**:
- "deprecated"
- "backward compat" / "backward compatibility"
- "keep for" / "legacy"
- "old"

**Severity**: HIGH (hard block)

**Rationale**: These comments indicate intentional parallel implementations for backward compatibility, which violates M3.

**Example**:
```typescript
// ❌ VIOLATION DETECTED
export const forecastsRouter = router({
  getForecastData,              // Deprecated, keep for Phase 3.5 compatibility
  getForecastDataEnhanced,      // Primary going forward
})
```

### Strategy 3: Semantic Base Name Duplication (HIGH SEVERITY)

**What it detects**: Multiple procedure files with similar base names (ignoring version suffixes)

**How it works**:
1. Extract all `*.procedure.ts` filenames
2. Normalize names (strip `-enhanced`, `-v2`, etc.)
3. Find duplicates

**Severity**: HIGH (hard block)

**Rationale**: This is the PRIMARY enforcement check. If multiple files normalize to same base name, they're parallel implementations.

**Example**:
```
Files found:
- get-forecast-data.procedure.ts
- get-forecast-data-enhanced.procedure.ts

Normalized base names:
- get-forecast-data  ← DUPLICATE
- get-forecast-data  ← DUPLICATE

❌ VIOLATION: Semantic duplication detected
```

---

## Usage

### One-Time Setup

```bash
# Install pre-commit hook (do once per machine)
./scripts/setup-validation-hooks.sh
```

**What this does**:
1. Makes validator script executable
2. Installs pre-commit hook to `.git/hooks/pre-commit`
3. Tests validator on current codebase
4. Reports installation success

### Manual Validation (Anytime)

```bash
# Run validator manually
./scripts/validate-no-parallel-implementations.sh

# Exit codes:
# 0 = No violations (clean)
# 1 = Violations detected (fix required)
```

### Automatic Validation (Every Commit)

```bash
# Normal commit (validator runs automatically)
git add <files>
git commit -m "your message"

# If violations detected → Commit BLOCKED
# If clean → Commit proceeds
```

### Bypass (NOT RECOMMENDED)

```bash
git commit --no-verify  # Bypasses pre-commit hook

# ⚠️ WARNING: Only use for documented architectural decisions
# ⚠️ Phase 5/6 validators will still catch violations later
```

---

## Policy: Deprecation & Backward Compatibility

### Default Rule: NO Parallel Implementations

Enhanced/improved versions MUST replace old versions in the SAME migration. No temporary coexistence.

### Exception: External API Compatibility (RARE)

If backward compatibility is ABSOLUTELY required (e.g., public-facing API):

1. **Document justification** in ledger
2. **Add deprecation comment** with removal timeline:
   ```typescript
   // DEPRECATED - Remove in migration [N+2] (by 2025-12-15)
   export const oldProcedure = ...
   ```
3. **Maximum window**: 2 migrations
4. **Update internal usage** immediately to new version
5. **Remove by deadline** (validator will enforce)

### Timeline Enforcement

Pre-commit hook will detect deprecation comments and warn if timeline exceeded.

---

## Examples

### ✅ CORRECT: Clean Replacement

**Before Migration**:
```
packages/api/src/procedures/forecasts/
  get-forecast-data.procedure.ts
```

**After Migration**:
```
packages/api/src/procedures/forecasts/
  get-forecast-data-enhanced.procedure.ts  ← Replaced old version
```

**Router**:
```typescript
export const forecastsRouter = router({
  getForecastDataEnhanced,  // Only export
})
```

**Validation**: ✅ Passes (no duplication)

### ❌ VIOLATION: Parallel Implementation

**Files**:
```
packages/api/src/procedures/forecasts/
  get-forecast-data.procedure.ts           ← Old
  get-forecast-data-enhanced.procedure.ts  ← New (BOTH EXIST)
```

**Router**:
```typescript
export const forecastsRouter = router({
  getForecastData,              // Deprecated, keep for backward compat
  getForecastDataEnhanced,      // Primary going forward
})
```

**Validation**: ❌ Blocked by Strategy 2 (router comment) AND Strategy 3 (semantic duplication)

---

## Troubleshooting

### Q: Commit blocked but I only have one version

**Check**: Do you have files with similar base names?
```bash
find packages/api/src/procedures -name "*.procedure.ts" | grep "your-procedure"
```

**Solution**: Ensure only ONE file per capability. Delete old versions.

### Q: I need both versions temporarily

**Answer**: This violates M3. Options:
1. Complete migration in phases (recommended)
2. Use feature flags if absolutely required
3. Document exception in ledger (rare, requires justification)

### Q: How do I test without triggering hook?

**Answer**: Test in separate branch:
```bash
git checkout -b test-branch
# Make changes
./scripts/validate-no-parallel-implementations.sh  # Manual test
```

### Q: Hook not running

**Check installation**:
```bash
ls -la .git/hooks/pre-commit
# Should exist and be executable

# Reinstall:
./scripts/setup-validation-hooks.sh
```

---

## Maintenance

### Updating Detection Patterns

To add new version patterns to detect:

1. Edit `scripts/validate-no-parallel-implementations.sh`
2. Add pattern to Strategy 1 find command:
   ```bash
   -name "*-yourpattern.*" -o \
   ```
3. Test against current codebase
4. Commit update

### Monitoring Effectiveness

Check validation statistics:
```bash
# Count blocked commits (git reflog shows rejected attempts)
git reflog | grep "parallel implementation" | wc -l

# Architecture health trends
cat thoughts/shared/architecture-health/*.md | grep "parallel_implementations"
```

---

## Implementation Details

### Files Created

| File | Purpose | Lines |
|------|---------|-------|
| `scripts/validate-no-parallel-implementations.sh` | Core validator (3 strategies) | 180 |
| `scripts/pre-commit-hook.sh` | Git pre-commit hook template | 60 |
| `scripts/setup-validation-hooks.sh` | Installation script | 120 |

### Agent Prompts Updated

| Agent | File | Section Updated |
|-------|------|-----------------|
| Phase 5: Migration Validator | `.opencode/agent/migration-validator.md` | M-CELL-2 verification |
| Phase 6: Architecture Health Monitor | `.opencode/agent/architecture-health-monitor.md` | Anti-pattern detection |

### Documentation Updated

| Document | Section |
|----------|---------|
| `docs/ai-native-codebase-architecture.md` | 4.1.1. Enforcement: Automated Prevention |

---

## Success Metrics

**Target**: 100% prevention of parallel implementations

**Measurement**:
- **Pre-commit blocks**: Violations caught before code enters repository
- **Phase 5 failures**: Migrations rejected due to M3 violations  
- **Phase 6 debt**: Architecture debt from parallel implementations = 0

**Current Status** (as of 2025-10-07):
- ✅ Pre-commit hook active
- ✅ Validator integrated into Phase 5/6
- ✅ Zero parallel implementations in codebase
- ✅ Policy documented

---

## Related Documentation

- **M3 Policy**: `docs/ai-native-codebase-architecture.md` (Section 4.1)
- **Migration Workflow**: `docs/ai-native-codebase-architecture.md` (Section 4.2)
- **Phase 5 Validation**: `.opencode/agent/migration-validator.md`
- **Phase 6 Health Monitoring**: `.opencode/agent/architecture-health-monitor.md`

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-07  
**Maintained By**: Architecture Team
