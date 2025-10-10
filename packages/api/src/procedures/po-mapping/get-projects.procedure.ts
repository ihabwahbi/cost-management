import { z } from 'zod';
import { publicProcedure } from '../../trpc';
import { projects } from '@cost-mgmt/db';
import { TRPCError } from '@trpc/server';

/**
 * Get all projects for PO mapping dropdown
 * Returns: Array of projects with id, name, subBusinessLine
 */
export const getProjects = publicProcedure
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
      console.error('[getProjects] Failed:', error);
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch projects. Please try again.',
        cause: error,
      });
    }
  });
