import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { db, costBreakdown, projects } from '@cost-mgmt/db';
import { eq, desc } from 'drizzle-orm';

/**
 * Get Cost Breakdowns for Mapping
 * 
 * Purpose: Replace fetchCostBreakdowns() zombie function
 * Complexity: ~50 lines (under 200 limit ✓)
 * 
 * Returns cost breakdown items with project information
 * for mapping PO line items to budget lines
 */
export const getCostBreakdownsForMapping = publicProcedure
  .input(
    z.object({
      projectId: z.string().uuid().optional(),
    })
  )
  .query(async ({ input }) => {
    const data = await db
      .select({
        id: costBreakdown.id,
        projectId: costBreakdown.projectId,
        subBusinessLine: costBreakdown.subBusinessLine,
        costLine: costBreakdown.costLine,
        spendType: costBreakdown.spendType,
        spendSubCategory: costBreakdown.spendSubCategory,
        budgetCost: costBreakdown.budgetCost,
        project: {
          name: projects.name,
        },
      })
      .from(costBreakdown)
      .innerJoin(projects, eq(projects.id, costBreakdown.projectId))
      .where(input.projectId ? eq(costBreakdown.projectId, input.projectId) : undefined)
      .orderBy(desc(costBreakdown.createdAt));

    return data;
  });
