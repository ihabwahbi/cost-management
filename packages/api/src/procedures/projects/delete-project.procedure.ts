import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, projects } from '@cost-mgmt/db'
import { eq } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'

/**
 * Delete Project Procedure
 * 
 * Deletes a project by ID.
 * Note: Cascading deletes handled by database foreign key constraints.
 * 
 * @procedure projects.deleteProject
 */
export const deleteProject = publicProcedure
  .input(z.object({
    id: z.string().uuid()
  }))
  .mutation(async ({ input }) => {
    const [deleted] = await db
      .delete(projects)
      .where(eq(projects.id, input.id))
      .returning()
    
    if (!deleted) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Project not found'
      })
    }
    
    return {
      success: true,
      deletedId: deleted.id
    }
  })
