import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { db, projects } from '@cost-mgmt/db'
import { desc, asc, like } from 'drizzle-orm'

/**
 * Get Projects List Procedure
 * 
 * Retrieves all projects with optional search and ordering.
 * Supports ordering by name or creation date.
 * 
 * @procedure projects.getProjectsList
 */
export const getProjectsList = publicProcedure
  .input(z.object({
    orderBy: z.enum(['name', 'createdAt']).optional().default('createdAt'),
    orderDirection: z.enum(['asc', 'desc']).optional().default('desc'),
    search: z.string().optional()
  }))
  .query(async ({ input }) => {
    // Determine ordering
    const orderFn = input.orderDirection === 'asc' ? asc : desc
    const orderCol = input.orderBy === 'name' ? projects.name : projects.createdAt
    
    // Build and execute query
    const baseQuery = db.select().from(projects)
    
    const result = await (input.search
      ? baseQuery
          .where(like(projects.name, `%${input.search}%`))
          .orderBy(orderFn(orderCol))
      : baseQuery.orderBy(orderFn(orderCol)))
    
    return result
  })
