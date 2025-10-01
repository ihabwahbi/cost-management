import { initTRPC } from '@trpc/server';
import { db } from '@cost-mgmt/db';

/**
 * tRPC Server Configuration
 * 
 * This file sets up the tRPC instance with context and procedures.
 * 
 * Context includes:
 * - Database client (Drizzle ORM)
 * - Future: User authentication
 */

// Context type for tRPC procedures
export interface Context {
  db: typeof db;
  // Future: user?: User;
}

/**
 * Initialize tRPC instance
 */
const t = initTRPC.context<Context>().create();

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;

/**
 * Middleware for future protected procedures
 * 
 * Example usage:
 * export const protectedProcedure = publicProcedure.use(async ({ ctx, next }) => {
 *   if (!ctx.user) {
 *     throw new TRPCError({ code: 'UNAUTHORIZED' });
 *   }
 *   return next({ ctx: { ...ctx, user: ctx.user } });
 * });
 */
