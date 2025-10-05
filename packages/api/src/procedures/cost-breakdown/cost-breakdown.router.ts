import { router } from '../../trpc'
import { getCostBreakdownByProject } from './get-cost-breakdown-by-project.procedure'
import { getCostBreakdownByVersion } from './get-cost-breakdown-by-version.procedure'
import { getCostBreakdownBaseline } from './get-cost-breakdown-baseline.procedure'
import { createCostEntry } from './create-cost-entry.procedure'
import { updateCostEntry } from './update-cost-entry.procedure'
import { deleteCostEntry } from './delete-cost-entry.procedure'
import { bulkDeleteCostEntries } from './bulk-delete-cost-entries.procedure'

/**
 * Cost Breakdown domain router
 * Aggregates all cost breakdown CRUD operations
 */
export const costBreakdownRouter = router({
  getCostBreakdownByProject,      // Existing (base data only - keep for backward compat)
  getCostBreakdownByVersion,       // NEW (version-aware - primary going forward)
  getCostBreakdownBaseline,
  createCostEntry,
  updateCostEntry,
  deleteCostEntry,
  bulkDeleteCostEntries,
})
