import { router } from '../../trpc'
import { getCostBreakdownByProject } from './get-cost-breakdown-by-project.procedure'
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
  getCostBreakdownByProject,
  getCostBreakdownBaseline,
  createCostEntry,
  updateCostEntry,
  deleteCostEntry,
  bulkDeleteCostEntries,
})
