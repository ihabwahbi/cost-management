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
// Dashboard Router - KPI Metrics & P&L Data
// ============================================================================

// Constants for P&L calculations
const FALLBACK_INVOICE_RATIO = 0.6;

// Helper: Calculate actual vs future P&L from line item
function splitMappedAmount(mappedAmount: number, lineItem: any): { actual: number; future: number } {
  const lineValue = Number(lineItem.line_value || 0);
  const invoiceValue = Number(lineItem.invoiced_value_usd || 0);
  const hasInvoiceField = lineItem.invoiced_value_usd !== null;
  
  const safeLineValue = lineValue > 0 ? lineValue : mappedAmount;
  const ratio = safeLineValue > 0 ? Math.min(mappedAmount / safeLineValue, 1) : 1;
  
  // If we have invoice data, use it
  if (hasInvoiceField && invoiceValue > 0) {
    const actual = invoiceValue * ratio;
    const future = Math.max(mappedAmount - actual, 0);
    return { actual, future };
  }
  
  // If invoiced_value_usd is 0 or null, this is a future item
  // Do NOT use fallback ratio - these are open POs
  return {
    actual: 0,
    future: mappedAmount
  };
}

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

  /**
   * Get P&L Metrics for PLCommandCenter
   * Returns comprehensive P&L breakdown
   */
  getPLMetrics: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        filters: z.object({
          costLine: z.string().optional(),
          spendType: z.string().optional(),
        }).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get total budget
        const budgetResult = await ctx.sql`
          SELECT COALESCE(SUM(budget_cost), 0) as total
          FROM cost_breakdown
          WHERE project_id = ${input.projectId}
        `;
        
        const totalBudget = Number(budgetResult[0]?.total || 0);

        if (totalBudget === 0) {
          return {
            totalBudget: 0,
            totalCommitted: 0,
            actualPLImpact: 0,
            futurePLImpact: 0,
            plGap: 0,
          };
        }

        // Get PO mappings with line items
        const mappingsData = await ctx.sql`
          SELECT 
            pm.mapped_amount,
            pl.line_value,
            pl.invoiced_value_usd
          FROM po_mappings pm
          LEFT JOIN po_line_items pl ON pm.po_line_item_id = pl.id
          INNER JOIN cost_breakdown cb ON pm.cost_breakdown_id = cb.id
          WHERE cb.project_id = ${input.projectId}
        `;

        let totalCommitted = 0;
        let actualPLImpact = 0;
        let futurePLImpact = 0;

        mappingsData.forEach((mapping: any) => {
          const mappedAmount = Number(mapping.mapped_amount || 0);
          totalCommitted += mappedAmount;

          const { actual, future } = splitMappedAmount(mappedAmount, mapping);
          actualPLImpact += actual;
          futurePLImpact += future;
        });

        return {
          totalBudget,
          totalCommitted,
          actualPLImpact,
          futurePLImpact,
          plGap: totalCommitted - actualPLImpact,
        };
      } catch (error) {
        console.error('Failed to fetch P&L metrics:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch P&L metrics. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get P&L Timeline (monthly breakdown)
   */
  getPLTimeline: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
        dateRange: z.object({
          from: z.string().transform((val) => new Date(val)),
          to: z.string().transform((val) => new Date(val)),
        }),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get mappings with line items
        const mappingsData = await ctx.sql`
          SELECT 
            pm.mapped_amount,
            pl.line_value,
            pl.invoiced_value_usd,
            pl.invoice_date,
            pl.supplier_promise_date,
            pl.created_at
          FROM po_mappings pm
          LEFT JOIN po_line_items pl ON pm.po_line_item_id = pl.id
          INNER JOIN cost_breakdown cb ON pm.cost_breakdown_id = cb.id
          WHERE cb.project_id = ${input.projectId}
        `;

        // Group by month
        const monthlyData = new Map<string, { actual: number; projected: number }>();

        const addToMonth = (date: Date | null, key: 'actual' | 'projected', amount: number) => {
          if (!date || amount <= 0) return;
          if (date < input.dateRange.from || date > input.dateRange.to) return;
          
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          const current = monthlyData.get(monthKey) || { actual: 0, projected: 0 };
          current[key] += amount;
          monthlyData.set(monthKey, current);
        };

        mappingsData.forEach((mapping: any) => {
          const mappedAmount = Number(mapping.mapped_amount || 0);
          const { actual, future } = splitMappedAmount(mappedAmount, mapping);
          
          const invoiceDate = mapping.invoice_date 
            ? new Date(mapping.invoice_date) 
            : mapping.created_at 
              ? new Date(mapping.created_at) 
              : null;
          
          const promiseDate = mapping.supplier_promise_date 
            ? new Date(mapping.supplier_promise_date) 
            : null;

          addToMonth(invoiceDate, 'actual', actual);
          addToMonth(promiseDate || invoiceDate, 'projected', future);
        });

        // Convert to sorted timeline
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const timeline = Array.from(monthlyData.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([monthKey, data]) => {
            const [year, month] = monthKey.split('-');
            return {
              month: monthNames[parseInt(month) - 1],
              year: parseInt(year),
              actualPL: data.actual,
              projectedPL: data.projected,
              cumulative: 0,
            };
          });

        // Calculate cumulative
        let cumulative = 0;
        timeline.forEach(entry => {
          cumulative += entry.actualPL + entry.projectedPL;
          entry.cumulative = cumulative;
        });

        return timeline;
      } catch (error) {
        console.error('Failed to fetch P&L timeline:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch P&L timeline. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Get Promise Dates (next P&L hits)
   */
  getPromiseDates: publicProcedure
    .input(
      z.object({
        projectId: z.string().uuid(),
      })
    )
    .query(async ({ input, ctx }) => {
      try {
        // Get mappings with line items that have promise dates
        const mappingsData = await ctx.sql`
          SELECT 
            pm.mapped_amount,
            pl.line_value,
            pl.invoiced_value_usd,
            pl.supplier_promise_date
          FROM po_mappings pm
          INNER JOIN po_line_items pl ON pm.po_line_item_id = pl.id
          INNER JOIN cost_breakdown cb ON pm.cost_breakdown_id = cb.id
          WHERE cb.project_id = ${input.projectId}
            AND pl.supplier_promise_date IS NOT NULL
        `;

        // Group by promise date
        const promiseDateMap = new Map<string, { amount: number; lineItemCount: number }>();

        mappingsData.forEach((mapping: any) => {
          if (!mapping.supplier_promise_date) return;
          
          const mappedAmount = Number(mapping.mapped_amount || 0);
          const { future } = splitMappedAmount(mappedAmount, mapping);

          if (future <= 0) return;

          const dateKey = new Date(mapping.supplier_promise_date).toISOString().split('T')[0];
          const existing = promiseDateMap.get(dateKey) || { amount: 0, lineItemCount: 0 };
          existing.amount += future;
          existing.lineItemCount += 1;
          promiseDateMap.set(dateKey, existing);
        });

        // Convert to array and sort by date
        return Array.from(promiseDateMap.entries())
          .map(([date, data]) => ({
            date,
            amount: data.amount,
            supplierName: undefined,
            lineItemCount: data.lineItemCount,
          }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 10);
      } catch (error) {
        console.error('Failed to fetch promise dates:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch promise dates. Please try again.',
          cause: error,
        });
      }
    }),
});

// ============================================================================
// PO Mapping Router - Phase A: Read Operations (Procedures 1-3)
// ============================================================================

const poMappingRouter = router({
  /**
   * Procedure 1: Get all projects for dropdown
   */
  getProjects: publicProcedure
    .input(z.void())
    .query(async ({ ctx }) => {
      try {
        const result = await ctx.sql`
          SELECT id, name, sub_business_line as "subBusinessLine"
          FROM projects
          ORDER BY name
        `;
        
        return result;
      } catch (error) {
        console.error('Failed to fetch projects:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch projects. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 2: Get unique spend types for a project
   */
  getSpendTypes: publicProcedure
    .input(z.object({
      projectId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.sql`
          SELECT DISTINCT spend_type as "spendType"
          FROM cost_breakdown
          WHERE project_id = ${input.projectId}
          ORDER BY spend_type
        `;
        
        return result.map((r: any) => r.spendType);
      } catch (error) {
        console.error('Failed to fetch spend types:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch spend types. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 3: Get unique spend subcategories for project + spend type
   */
  getSpendSubCategories: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      spendType: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.sql`
          SELECT DISTINCT spend_sub_category as "spendSubCategory"
          FROM cost_breakdown
          WHERE project_id = ${input.projectId}
            AND spend_type = ${input.spendType}
          ORDER BY spend_sub_category
        `;
        
        return result.map((r: any) => r.spendSubCategory);
      } catch (error) {
        console.error('Failed to fetch spend subcategories:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch spend subcategories. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 4: Find matching cost breakdown
   */
  findMatchingCostBreakdown: publicProcedure
    .input(z.object({
      projectId: z.string().uuid(),
      spendType: z.string(),
      spendSubCategory: z.string()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.sql`
          SELECT 
            cb.id,
            cb.project_id as "projectId",
            cb.sub_business_line as "subBusinessLine",
            cb.cost_line as "costLine",
            cb.spend_type as "spendType",
            cb.spend_sub_category as "spendSubCategory",
            cb.budget_cost as "budgetCost"
          FROM cost_breakdown cb
          INNER JOIN projects p ON p.id = cb.project_id
          WHERE cb.project_id = ${input.projectId}
            AND cb.spend_type = ${input.spendType}
            AND cb.spend_sub_category = ${input.spendSubCategory}
        `;
        
        return result;
      } catch (error) {
        console.error('Failed to find matching cost breakdown:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to find matching cost breakdown. Please try again.',
          cause: error,
        });
      }
    }),

  /**
   * Procedure 5: Get existing PO mappings
   */
  getExistingMappings: publicProcedure
    .input(z.object({
      poId: z.string().uuid()
    }))
    .query(async ({ ctx, input }) => {
      try {
        const result = await ctx.sql`
          SELECT 
            pm.id,
            pm.po_line_item_id as "poLineItemId",
            pm.cost_breakdown_id as "costBreakdownId",
            pm.mapped_amount as "mappedAmount",
            pm.mapping_notes as "mappingNotes",
            pli.line_item_number as "lineItemNumber",
            pli.description,
            pli.quantity,
            pli.line_value as "lineValue",
            cb.cost_line as "costLine",
            cb.spend_type as "spendType",
            cb.spend_sub_category as "spendSubCategory"
          FROM po_mappings pm
          INNER JOIN po_line_items pli ON pli.id = pm.po_line_item_id
          INNER JOIN cost_breakdown cb ON cb.id = pm.cost_breakdown_id
          WHERE pli.po_id = ${input.poId}
        `;
        
        return result;
      } catch (error) {
        console.error('Failed to fetch existing mappings:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch existing mappings. Please try again.',
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
  poMapping: poMappingRouter,
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
