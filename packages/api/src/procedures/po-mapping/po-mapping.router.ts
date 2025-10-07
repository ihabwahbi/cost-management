import { router } from '../../trpc';
import { getProjects } from './get-projects.procedure';
import { getSpendTypes } from './get-spend-types.procedure';
import { getSpendSubCategories } from './get-spend-sub-categories.procedure';
import { findMatchingCostBreakdown } from './find-matching-cost-breakdown.procedure';
import { getExistingMappings } from './get-existing-mappings.procedure';
import { createMapping } from './create-mapping.procedure';
import { updateMapping } from './update-mapping.procedure';
import { clearMappings } from './clear-mappings.procedure';
import { getCostBreakdownById } from './get-cost-breakdown-by-id.procedure';
import { getPOSummary } from './get-po-summary.procedure';

/**
 * PO Mapping Domain Router
 * Aggregates all PO mapping procedures (10 total: 7 queries + 3 mutations)
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
  getPOSummary,               // Direct reference (NEW - Phase 6)
});
