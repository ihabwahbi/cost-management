/**
 * tRPC Client for Next.js App
 * 
 * Provides type-safe API client with full autocomplete support
 */

import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@cost-mgmt/api';

/**
 * Get tRPC endpoint URL from environment
 * 
 * Development: Uses local Supabase Edge Function or mock
 * Production: Uses deployed Edge Function
 */
const getTRPCUrl = () => {
  const url = process.env.NEXT_PUBLIC_TRPC_URL;
  
  if (!url) {
    console.warn('NEXT_PUBLIC_TRPC_URL not set, tRPC calls will fail');
    return 'http://localhost:54321/functions/v1/trpc';
  }
  
  return url;
};

/**
 * tRPC Client Instance
 * 
 * Usage:
 *   const greeting = await trpc.test.hello.query({ name: 'World' });
 *   console.log(greeting.message);
 */
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: getTRPCUrl(),
      
      // Optional: Add headers (e.g., for authentication)
      headers() {
        return {
          // 'Authorization': `Bearer ${token}`,
        };
      },
    }),
  ],
});

/**
 * Type-safe tRPC client with full autocomplete
 * 
 * Available procedures:
 * - trpc.test.hello.query({ name: string })
 * - trpc.test.healthCheck.query()
 */
