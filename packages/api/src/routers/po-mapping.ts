import { z } from 'zod';
import { router, publicProcedure } from '../trpc';
import { eq, and, inArray } from 'drizzle-orm';
import { 
  projects, 
  costBreakdown, 
  poMappings, 
  poLineItems,
  pos 
} from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * PO Mapping Router
 * Procedures for PO mapping functionality
 * 
 * Replaces direct Supabase queries from details-panel.tsx
 * Migration: Phase A - Read Operations (Procedures 1-5)
 */

export const poMappingRouter = router({
  /**
   * Procedure 1: Get all projects for dropdown
   * Returns: Array of projects with id, name, subBusinessLine
   */
  getProjects: publicProcedure
    .input(z.void())
    .output(z.array(z.object({
      id: z.string().uuid(),
      name: z.string(),
      subBusinessLine: z.string()
    })))
    .query(async ({ ctx }) => {
      try {
        const result = await ctx.db
          .select({
            id: projects.id,
            name: projects.name,
            subBusinessLine: projects.subBusinessLine
          })
          .from(projects)
          .orderBy(projects.name);
        
        return result;
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 2: Get unique spend types for a project
   * Returns: Array of spend type strings
   */
  getSpendTypes: publicProcedure
    .input(z.object({
      projectId: z.string().uuid()
    }))
    .output(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .selectDistinct({ spendType: costBreakdown.spendType })
          .from(costBreakdown)
          .where(eq(costBreakdown.projectId, input.projectId))
          .orderBy(costBreakdown.spendType);
        
        return result.map(r => r.spendType);
      } catch (error) {
        console.error('Failed to fetch spend types:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch spend types. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 3: Get unique spend subcategories for project + spend type
   * Returns: Array of subcategory strings
   */
  getSpendSubCategories: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      spendType: z.string()
    }))
    .output(z.array(z.string()))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .selectDistinct({ spendSubCategory: costBreakdown.spendSubCategory })
          .from(costBreakdown)
          .where(and(
            eq(costBreakdown.projectId, input.projectId),
            eq(costBreakdown.spendType, input.spendType)
          ))
          .orderBy(costBreakdown.spendSubCategory);
        
        return result.map(r => r.spendSubCategory);
      } catch (error) {
        console.error('Failed to fetch spend subcategories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch spend subcategories. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 4: Find matching cost breakdown
   * Returns: Array of cost breakdown objects matching criteria
   */
  findMatchingCostBreakdown: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      spendType: z.string(),
      spendSubCategory: z.string()
    }))
    .output(z.array(z.object({
      id: z.string().uuid(),
      projectId: z.string().uuid(),
      subBusinessLine: z.string(),
      costLine: z.string(),
      spendType: z.string(),
      spendSubCategory: z.string(),
      budgetCost: z.string().nullable()
    })))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select({
            id: costBreakdown.id,
            projectId: costBreakdown.projectId,
            subBusinessLine: costBreakdown.subBusinessLine,
            costLine: costBreakdown.costLine,
            spendType: costBreakdown.spendType,
            spendSubCategory: costBreakdown.spendSubCategory,
            budgetCost: costBreakdown.budgetCost
          })
          .from(costBreakdown)
          .innerJoin(projects, eq(projects.id, costBreakdown.projectId))
          .where(and(
            eq(costBreakdown.projectId, input.projectId),
            eq(costBreakdown.spendType, input.spendType),
            eq(costBreakdown.spendSubCategory, input.spendSubCategory)
          ));
        
        return result;
      } catch (error) {
        console.error('Failed to find matching cost breakdown:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find matching cost breakdown. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 5: Get existing PO mappings
   * Returns: Array of mapping objects with line item and cost breakdown details
   */
  getExistingMappings: publicProcedure
    .input(z.object({
      poId: z.string().uuid()
    }))
    .output(z.array(z.object({
      id: z.string().uuid(),
      poLineItemId: z.string().uuid(),
      costBreakdownId: z.string().uuid(),
      mappedAmount: z.string(),
      mappingNotes: z.string().nullable(),
      lineItemNumber: z.number(),
      description: z.string(),
      quantity: z.string(),
      lineValue: z.string().nullable(),
      costLine: z.string(),
      spendType: z.string(),
      spendSubCategory: z.string()
    })))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
          .select({
            id: poMappings.id,
            poLineItemId: poMappings.poLineItemId,
            costBreakdownId: poMappings.costBreakdownId,
            mappedAmount: poMappings.mappedAmount,
            mappingNotes: poMappings.mappingNotes,
            lineItemNumber: poLineItems.lineItemNumber,
            description: poLineItems.description,
            quantity: poLineItems.quantity,
            lineValue: poLineItems.lineValue,
            costLine: costBreakdown.costLine,
            spendType: costBreakdown.spendType,
            spendSubCategory: costBreakdown.spendSubCategory
          })
          .from(poMappings)
          .innerJoin(poLineItems, eq(poLineItems.id, poMappings.poLineItemId))
          .innerJoin(costBreakdown, eq(costBreakdown.id, poMappings.costBreakdownId))
          .where(eq(poLineItems.poId, input.poId));
        
        return result;
      } catch (error) {
        console.error('Failed to fetch existing mappings:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch existing mappings. Please try again.',
          cause: error,
        });
      }
    }),
});
