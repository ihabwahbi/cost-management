// packages/api/src/procedures/dashboard/get-project-details.procedure.ts

import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { projects } from '@cost-mgmt/db'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * Get project details by ID
 * 
 * CRITICAL: Direct export pattern (NO router wrapper, NO "Router" suffix)
 * Import publicProcedure only (NOT router)
 * 
 * Purpose: Replace direct Supabase query from page component
 * File size: ~45 lines (well under 200-line limit) ✅
 * Export pattern: Direct procedure (NO router wrapper) ✅
 */
export const getProjectDetails = publicProcedure
  .input(z.object({
    projectId: z.string().uuid()
  }))
  .query(async ({ input, ctx }) => {
    // Use Drizzle eq() helper (NOT raw SQL)
    const [project] = await ctx.db
      .select({
        id: projects.id,
        name: projects.name,
        subBusinessLine: projects.subBusinessLine,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt
      })
      .from(projects)
      .where(eq(projects.id, input.projectId))
      .limit(1)

    // Error handling with TRPCError
    if (!project) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Project ${input.projectId} not found`
      })
    }

    return project
  })
