/**
 * Supabase Edge Function for tRPC
 * 
 * This function serves the tRPC API router via HTTP
 * 
 * Deployment:
 *   supabase functions deploy trpc
 * 
 * URL:
 *   https://[PROJECT-REF].supabase.co/functions/v1/trpc
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createContext } from '../../../packages/api/src/index.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Handle tRPC requests
    return await fetchRequestHandler({
      endpoint: '/trpc',
      req,
      router: appRouter,
      createContext,
      onError({ error, path }) {
        console.error(`tRPC Error on ${path}:`, error);
      },
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
