import { router } from './trpc';
import { testRouter } from './routers/test';
import { dashboardRouter } from './procedures/dashboard/dashboard.router';
import { poMappingRouter } from './routers/po-mapping';
import { forecastsRouter } from './procedures/forecasts/forecasts.router';
import { db } from '@cost-mgmt/db';
import type { Context } from './trpc';

/**
 * Main tRPC App Router
 * 
 * Aggregates all sub-routers for the API
 */
export const appRouter = router({
  test: testRouter,
  dashboard: dashboardRouter,
  poMapping: poMappingRouter,
  forecasts: forecastsRouter,
  // Future routers will be added here:
  // projects: projectsRouter,
  // costBreakdown: costBreakdownRouter,
});

/**
 * Export type definition of API for client usage
 * 
 * This enables end-to-end type safety from server to client
 */
export type AppRouter = typeof appRouter;

/**
 * Create context for tRPC procedures
 * 
 * Called for each request to provide context to procedures
 */
export const createContext = (): Context => {
  return {
    db,
  };
};

/**
 * Export all router types for re-use
 */
export { type Context } from './trpc';
