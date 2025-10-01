/**
 * Supabase Edge Function for tRPC
 * 
 * Self-contained tRPC API router for dashboard metrics
 * 
 * Deployment:
 *   Via Supabase Dashboard: Edge Functions > Deploy New Function
 *   Upload this file and deno.json
 * 
 * URL:
 *   https://[PROJECT-REF].supabase.co/functions/v1/trpc
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { z } from 'zod';
import postgres from 'postgres';

// ============================================================================
// Database Setup
// ============================================================================

const sql = postgres(Deno.env.get('DATABASE_URL')!, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

// ============================================================================
// tRPC Context
// ============================================================================

interface Context {
  sql: typeof sql;
}

const t = initTRPC.context<Context>().create();

const router = t.router;
const publicProcedure = t.procedure;

// ============================================================================
// Dashboard Router - KPI Metrics
// ============================================================================

const dashboardRouter = router({
  /**
   * Get KPI Metrics for a project
   * Returns budget total, committed amount, and variance
   */
  getKPIMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Calculate total budget from cost breakdown
        const budgetResult = await ctx.sql`
          SELECT COALESCE(SUM(budget_cost), 0) as total
          FROM cost_breakdown
          WHERE project_id = ${input.projectId}
        `;
        
        const budgetTotal = Number(budgetResult[0]?.total || 0);

        // Calculate committed amount from PO mappings
        const committedResult = await ctx.sql`
          SELECT COALESCE(SUM(pm.mapped_amount), 0) as total
          FROM po_mappings pm
          INNER JOIN cost_breakdown cb ON pm.cost_breakdown_id = cb.id
          WHERE cb.project_id = ${input.projectId}
        `;
        
        const committed = Number(committedResult[0]?.total || 0);

        // Calculate variance
        const variance = budgetTotal - committed;
        const variancePercent = budgetTotal > 0 ? (variance / budgetTotal) * 100 : 0;

        return {
          budgetTotal,
          committed,
          variance,
          variancePercent,
        };
      } catch (error) {
        console.error('Failed to fetch KPI metrics:', error);
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch KPI metrics. Please try again.',
          cause: error,
        });
      }
    }),
});

// ============================================================================
// Test Router
// ============================================================================

const testRouter = router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }))
    .query(({ input }) => ({
      message: `Hello ${input.name || 'World'}!`,
      timestamp: new Date().toISOString(),
    })),
    
  healthCheck: publicProcedure
    .query(async ({ ctx }) => {
      try {
        // Test database connection
        await ctx.sql`SELECT 1 as ok`;
        
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

// ============================================================================
// Main App Router
// ============================================================================

const appRouter = router({
  test: testRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;

// ============================================================================
// Create Context
// ============================================================================

const createContext = (): Context => {
  return {
    sql,
  };
};

// ============================================================================
// CORS Headers
// ============================================================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// ============================================================================
// Deno Serve Handler
// ============================================================================

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Handle tRPC requests
    const response = await fetchRequestHandler({
      endpoint: '/trpc',
      req,
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`tRPC Error on ${path}:`, error);
      },
    });

    // Add CORS headers to response
    const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error('Edge Function Error:', error);
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : 'Internal server error',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
