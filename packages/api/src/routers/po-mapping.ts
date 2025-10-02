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
});
