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
 * Get tRPC endpoint URL from environment
 */
function getTRPCUrl() {
  const url = process.env.NEXT_PUBLIC_TRPC_URL;
  
  if (!url) {
    console.warn('NEXT_PUBLIC_TRPC_URL not set, using default');
    return 'http://localhost:54321/functions/v1/trpc';
  }
  
  return url;
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
