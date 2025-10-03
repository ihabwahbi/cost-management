/**
 * App Providers
 * 
 * Sets up tRPC React Query integration with QueryClientProvider
 */
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * Get tRPC endpoint URL
 * Uses Next.js API route for single source of truth
 */
function getTRPCUrl() {
  // Always use Next.js API route (no environment variable needed)
  const baseUrl = typeof window !== 'undefined' 
    ? '' // Browser: relative URL
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'; // Server: absolute URL
  
  return `${baseUrl}/api/trpc`;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
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
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
