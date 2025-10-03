import { router } from '../../trpc';

// Import all specialized dashboard procedures
import { getKPIMetrics } from './get-kpi-metrics.procedure';
import { getPLMetrics } from './get-pl-metrics.procedure';
import { getPLTimeline } from './get-pl-timeline.procedure';
import { getPromiseDates } from './get-promise-dates.procedure';
import { getTimelineBudget } from './get-timeline-budget.procedure';
import { getFinancialControlMetrics } from './get-financial-control-metrics.procedure';
import { getMainMetrics } from './get-main-metrics.procedure';
import { getRecentActivity } from './get-recent-activity.procedure';
import { getCategoryBreakdown } from './get-category-breakdown.procedure';
import { getTimelineData } from './get-timeline-data.procedure';

/**
 * Dashboard Domain Router
 * Aggregates all dashboard procedures following M1-M4 architecture mandates
 * 
 * Procedures (10 total):
 * - getKPIMetrics: KPI card metrics
 * - getPLMetrics: P&L command center metrics
 * - getPLTimeline: Monthly P&L timeline
 * - getPromiseDates: Upcoming promise dates
 * - getTimelineBudget: Budget timeline visualization
 * - getFinancialControlMetrics: Financial control matrix
 * - getMainMetrics: Main dashboard global metrics (Phase A-NEW)
 * - getRecentActivity: Recent PO mapping activity (Phase B-NEW)
 * - getCategoryBreakdown: Category spend breakdown (Phase C-NEW)
 * - getTimelineData: Monthly timeline with real forecasts (Phase C-NEW)
 */
export const dashboardRouter = router({
  getKPIMetrics,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
  getMainMetrics,
  getRecentActivity,
  getCategoryBreakdown,
  getTimelineData,
});
