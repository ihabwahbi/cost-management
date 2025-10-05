import { z } from 'zod';
import { publicProcedure } from '../../trpc';

/**
 * Hello world test endpoint
 * Used for: API health verification
 */
export const hello = publicProcedure
  .input(z.object({
    name: z.string()
  }))
  .query(async ({ input }) => {
    return {
      message: `Hello ${input.name} from tRPC Edge Function!`,
      timestamp: new Date().toISOString(),
    };
  });
