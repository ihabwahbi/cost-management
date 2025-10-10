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
import { getCostLineBreakdown } from './get-cost-line-breakdown.procedure';
import { getTimelineData } from './get-timeline-data.procedure';
import { getProjectMetrics } from './get-project-metrics.procedure';
import { getProjectCategoryBreakdown } from './get-project-category-breakdown.procedure';
import { getProjectHierarchicalBreakdown } from './get-project-hierarchical-breakdown.procedure';
import { getProjectDetails } from './get-project-details.procedure';

// Dashboard domain router - 13 procedures total (M1-M4 compliant)
export const dashboardRouter = router({
  getKPIMetrics,
  getPLMetrics,
  getPLTimeline,
  getPromiseDates,
  getTimelineBudget,
  getFinancialControlMetrics,
  getMainMetrics,
  getRecentActivity,
  getCostLineBreakdown,
  getTimelineData,
  getProjectMetrics,
  getProjectCategoryBreakdown,
  getProjectHierarchicalBreakdown,
  getProjectDetails,
});
