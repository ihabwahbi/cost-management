import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, projects } from '@cost-mgmt/db'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * Update Project Procedure
 * 
 * Updates an existing project.
 * At least one field must be provided for update.
 * 
 * @procedure projects.updateProject
 */
export const updateProject = publicProcedure
  .input(z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(255).optional(),
    subBusinessLine: z.enum([
      'Wireline',
      'Drilling & Measurement',
      'Well Construction',
      'Completions',
      'OneSubsea',
      'Production Systems'
    ]).optional()
  }))
  .mutation(async ({ input }) => {
    const { id, ...updates } = input
    
    if (Object.keys(updates).length === 0) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'No fields to update'
      })
    }
    
    const [updated] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning()
    
    if (!updated) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Project not found'
      })
    }
    
    return updated
  })
