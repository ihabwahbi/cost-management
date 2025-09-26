# Orphaned Components Archive

---
date: "2025-09-26T17:30:00Z"  
purpose: "Archive valuable orphaned components for future use"
---

## project-alerts.tsx

**Status**: Orphaned but valuable  
**Original Location**: `components/dashboard/project-alerts.tsx`  
**Business Value**: High - Proactive budget monitoring and alerting

### Component Features
- Budget overrun detection (>100% utilization)
- High utilization warnings (>90%)  
- Burn rate projections
- Open order tracking
- Positive variance celebration
- Dismissible alerts with state management

### Integration Notes
When ready to integrate:
1. Import in dashboard page
2. Place above KPI cards for visibility
3. Pass existing `metrics` object as prop
4. All required data already available from `calculateProjectMetrics`

### Future Enhancement Ideas
- Add email/notification integration
- Create alert history tracking
- Add customizable thresholds per project
- Include trend analysis (getting worse/better)

### Code Preservation
The component code is preserved in git history. To retrieve:
```bash
git show HEAD:components/dashboard/project-alerts.tsx > project-alerts.tsx
```

## burn-rate-chart.tsx (Removed)

**Status**: Removed - Data prepared but component never integrated
**Original Location**: `components/dashboard/burn-rate-chart.tsx`  
**Removal Date**: 2025-09-26

### Why Removed
- Never imported or used
- Data calculation exists but disconnected
- Can be easily recreated when needed

### Data Still Available
The burn rate calculation still exists in:
- `app/projects/[id]/dashboard/page.tsx` lines 238-252
- Function: `calculateBurnRateFromTimeline`

### Recreation Guide
If burn rate visualization needed:
1. Use existing Recharts BarChart pattern
2. Data source: `burnRateData` from timeline
3. Place between spend charts and cost table
4. Estimated effort: < 1 hour

## Summary of Cleanup

### Removed Components
1. **burn-rate-chart.tsx** - Orphaned, never integrated

### Kept for Future
1. **project-alerts.tsx** - High value alert system, easy to integrate

### Active Components Verified
1. **dashboard-filters.tsx** - Actively used for filtering
2. **dashboard-skeleton.tsx** - Loading state component  
3. **debug-panel.tsx** - Development tool (properly environment-gated)

## Recommendations

### Short Term (Next Sprint)
- Consider integrating project-alerts.tsx for improved UX
- Would provide immediate value with minimal effort (2-4 hours)

### Long Term
- Evaluate if burn rate visualization adds value
- Consider unified alert/notification system across app
- Regular orphan component audits (quarterly)