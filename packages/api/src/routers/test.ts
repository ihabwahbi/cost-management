import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

/**
 * Test Router
 * 
 * Simple "hello world" procedures for testing tRPC setup
 * and Edge Function deployment
 */
export const testRouter = router({
  /**
   * Hello procedure - Simple greeting
   * 
   * Usage:
   *   const result = await trpc.test.hello.query({ name: 'World' });
   *   // { message: 'Hello World from tRPC Edge Function!' }
   */
  hello: publicProcedure
    .input(
      z.object({
        name: z.string(),
      })
    )
    .query(async ({ input }) => {
      return {
        message: `Hello ${input.name} from tRPC Edge Function!`,
        timestamp: new Date().toISOString(),
      };
    }),

  /**
   * Health check procedure
   * 
   * Usage:
   *   const result = await trpc.test.healthCheck.query();
   */
  healthCheck: publicProcedure.query(async ({ ctx }) => {
    // Test database connection
    try {
      // Simple query to verify DB connection works
      await ctx.db.query.projects.findFirst();
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }),
});
