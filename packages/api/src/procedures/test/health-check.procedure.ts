import { publicProcedure } from '../../trpc';

/**
 * Database health check
 * Used for: Monitoring and diagnostics
 */
export const healthCheck = publicProcedure
  .query(async ({ ctx }) => {
    try {
      await ctx.db.query.projects.findFirst();
      return {
        status: 'healthy' as const,
        timestamp: new Date().toISOString(),
        database: 'connected' as const,
      };
    } catch (error) {
      return {
        status: 'unhealthy' as const,
        timestamp: new Date().toISOString(),
        database: 'disconnected' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
