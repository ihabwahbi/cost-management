# Architectural Policies

**Version**: 1.0  
**Date**: 2025-10-09  
**Status**: Official Policy  
**Authority**: Architecture Team

---

## Purpose

This document defines official exemptions and clarifications for ANDA (Agent-Navigable Dataflow Architecture) mandate compliance. All exemptions must meet strict criteria and undergo quarterly review.

---

## 1. Third-Party Component Exemptions

### Policy Statement

Third-party UI components from established libraries (shadcn/ui, Radix UI) are exempt from M-CELL-1 (All Functionality as Cells) **IF AND ONLY IF** they meet **ALL** of the following criteria:

### Exemption Criteria

A component qualifies for M-CELL-1 exemption if it meets **ALL 5 criteria**:

1. ✅ **Third-Party Origin**: Component source code is maintained by an external library (not custom-built)
2. ✅ **Vendor Maintenance**: Updates and bug fixes come from the library vendor, not our team
3. ✅ **Zero Custom Business Logic**: Component contains no project-specific business rules or data transformations
4. ✅ **Pure UI Presentation**: Component renders UI elements only, does not manage application state
5. ✅ **Documented Exemption**: Exemption is formally documented in this policy with justification

### Non-Qualifying Scenarios

The following scenarios **DO NOT** qualify for exemption:

- ❌ Components with custom business logic (even if based on third-party components)
- ❌ Components that manage application state (useState, useReducer, Zustand stores)
- ❌ Components with behavioral requirements beyond basic UI rendering
- ❌ "Layout components" that coordinate multiple child components with logic
- ❌ Wrapper components that add business logic to third-party components

---

## 2. Approved Exemptions

### 2.1 sidebar.tsx

**File**: `apps/web/components/ui/sidebar.tsx`  
**Source**: shadcn/ui component library  
**Lines**: 726 lines  
**Status**: ✅ **APPROVED EXEMPTION**

**Exemption Justification**:
1. ✅ Third-party origin: Official shadcn/ui component
2. ✅ Vendor-maintained: Updates come from shadcn/ui repository
3. ✅ Zero custom business logic: Pure UI composition and styling
4. ✅ Pure UI presentation: Provides sidebar layout primitives only
5. ✅ Documented: Formally approved in this policy

**Review Schedule**: Quarterly (Jan, Apr, Jul, Oct)

**Notes**:
- Contains no project-specific business logic
- Provides reusable UI primitives (Sidebar, SidebarContent, SidebarGroup, etc.)
- All business logic lives in consuming Cell components
- Follows shadcn/ui architecture patterns
- Large file size (726 lines) is acceptable for vendor-maintained component library

---

## 3. Exemption Request Process

### Requesting a New Exemption

To request exemption for a component from M-CELL-1 compliance:

**Step 1**: Document in GitHub Issue
- Title: "Architecture Exemption Request: [Component Name]"
- Template: Use `.github/ISSUE_TEMPLATE/architecture-exemption.md`
- Include:
  - Component path and file size
  - Third-party library source
  - Justification against **ALL 5 criteria**
  - Alternative approaches considered

**Step 2**: Architecture Review
- Schedule review with Architecture Team
- Present justification
- Answer clarifying questions
- Demonstrate criteria compliance

**Step 3**: Decision & Documentation
- **APPROVED**: Add to Section 2 of this document
- **REJECTED**: Migrate to Cell architecture per standard workflow
- **CONDITIONAL**: Address concerns and re-submit

### Exemption Denial Grounds

Exemption requests will be **DENIED** if:
- Any of the 5 criteria are not met
- Component contains custom business logic
- Component manages application state
- Simpler alternative exists (e.g., utility function)
- Exemption would create architectural inconsistency

---

## 4. Quarterly Review Process

### Review Schedule

**Frequency**: Quarterly (January, April, July, October)  
**Responsibility**: Architecture Team  
**Duration**: 1 hour review session

### Review Checklist

For each approved exemption:
- [ ] Component still meets all 5 exemption criteria
- [ ] No custom business logic added since last review
- [ ] Third-party library still actively maintained
- [ ] File size has not grown significantly (>20%)
- [ ] No better alternatives have emerged

### Review Outcomes

**MAINTAIN**: Exemption remains valid → No action required  
**REVOKE**: Exemption no longer valid → Schedule migration to Cell architecture  
**CONDITIONAL**: Issues found → Address issues by next quarterly review

---

## 5. Layout Component Clarification

### App Shell & Layout Components

**Question**: Are "layout components" (app-shell, page layouts) exempt from M-CELL-1?

**Answer**: ❌ **NO** - Layout components with state/logic/behavioral requirements **MUST** be Cells.

**Clarification**:

A component is **NOT** exempt simply because it serves a "layout" role. Classification depends on **functionality**, not **role**:

#### app-shell.tsx Example

**File**: `apps/web/components/app-shell.tsx` (175 lines)  
**Role**: Application shell with navigation, breadcrumbs, mobile sidebar  
**Status**: ❌ **NOT EXEMPT** - Must migrate to Cell architecture

**Why NOT exempt**:
- ✅ Has state management: `useState` for sidebar toggle
- ✅ Has business logic: `getBreadcrumbs()` routing function
- ✅ Has behavioral requirements: 5 behavioral assertions (sidebar toggle, breadcrumb updates, active nav highlighting)
- ✅ Has user interactions: Menu clicks, nav clicks, overlay clicks

**Decision**: app-shell.tsx has functionality beyond pure layout → **MUST be Cell**

#### Framework-Level Files

The **ONLY** truly exempt "layout" files are:
- `apps/web/app/layout.tsx`: Next.js framework file (root layout)
- `apps/web/app/error.tsx`: Next.js framework file (error boundary)
- Pure shadcn/ui components with zero business logic

---

## 6. M-CELL-1 Compliance Summary

### Mandate Statement

**M-CELL-1**: All Functionality as Cells

"Every component with behavioral requirements, state management, or business logic MUST be implemented as a Cell with manifest, pipeline, and tests."

### Compliance Status

**Total Components**: 25  
**Cells**: 23 (92%)  
**Valid Exemptions**: 1 (sidebar.tsx - third-party)  
**Non-Compliant**: 2 (app-shell.tsx, po-table.tsx - **MIGRATION REQUIRED**)

**M-CELL-1 Compliance**: 92% → Target: 100% (after app-shell & po-table migrations)

### Planned Actions

1. **app-shell.tsx → app-shell-cell** (3.5-4 hours)
   - 7-step migration with extraction
   - 5 behavioral assertions
   - Target completion: Phase C

2. **po-table.tsx → po-table-cell** (6-8 hours)
   - 8-step migration with extensive extraction
   - 10 behavioral assertions
   - Critical bug fixes included
   - Target completion: Phase C

3. **sidebar.tsx** (NO ACTION)
   - Valid exemption maintained
   - Quarterly review: Jan/Apr/Jul/Oct

---

## 7. Policy Enforcement

### Architecture Health Monitoring

**Automated Checks**:
- M-CELL-1 compliance tracked in `thoughts/shared/architecture-health/`
- Non-compliant components flagged in health reports
- Pre-commit hooks prevent new non-Cell components

**Manual Reviews**:
- Quarterly exemption reviews
- Architecture health assessments
- Migration progress tracking

### Violation Response

**Severity Levels**:
- **CRITICAL**: Non-Cell component with complex business logic → Immediate migration required
- **HIGH**: Non-Cell component with state management → Migration planned within sprint
- **MEDIUM**: Valid exemption without documentation → Document in next release

---

## 8. Document History

| Version | Date       | Author              | Changes                                  |
|---------|------------|---------------------|------------------------------------------|
| 1.0     | 2025-10-09 | MigrationArchitect  | Initial policy creation                  |
|         |            |                     | Documented sidebar.tsx exemption         |
|         |            |                     | Clarified layout component policy        |
|         |            |                     | Established exemption request process    |

---

**Next Review**: January 2026 (Quarterly)  
**Policy Owner**: Architecture Team  
**Approval Required For**: New exemptions, policy changes
