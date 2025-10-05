import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, projects } from '@cost-mgmt/db'
import { TRPCError } from '@trpc/server'

/**
 * Create Project Procedure
 * 
 * Creates a new project with validation.
 * Sub-business line must be one of the predefined values.
 * 
 * @procedure projects.createProject
 */
export const createProject = publicProcedure
  .input(z.object({
    name: z.string().min(1, "Project name required").max(255),
    subBusinessLine: z.enum([
      'Wireline',
      'Drilling & Measurement',
      'Well Construction',
      'Completions',
      'OneSubsea',
      'Production Systems'
    ])
  }))
  .mutation(async ({ input }) => {
    try {
      const [newProject] = await db
        .insert(projects)
        .values({
          name: input.name,
          subBusinessLine: input.subBusinessLine
        })
        .returning()
      
      if (!newProject) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create project'
        })
      }
      
      return newProject
    } catch (error) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: error instanceof Error ? error.message : 'Failed to create project'
      })
    }
  })
