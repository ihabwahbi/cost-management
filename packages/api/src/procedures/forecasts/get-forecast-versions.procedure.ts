import { z } from 'zod'
import { publicProcedure } from '../../trpc'
import { forecastVersions } from '@cost-mgmt/db'
import { eq, desc } from 'drizzle-orm'

export const getForecastVersions = publicProcedure
  .input(z.object({
    projectId: z.string().uuid(),
  }))
  .query(async ({ input, ctx }) => {
    const versions = await ctx.db
      .select()
      .from(forecastVersions)
      .where(eq(forecastVersions.projectId, input.projectId))
      .orderBy(desc(forecastVersions.versionNumber))
    
    return versions
  })
