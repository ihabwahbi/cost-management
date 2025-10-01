/**
 * tRPC React Query Client for Next.js App
 * 
 * Provides type-safe API client with React hooks support
 */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@cost-mgmt/api';

/**
 * tRPC React Query Client
 * 
 * Usage:
 *   const { data, isLoading } = trpc.test.hello.useQuery({ name: 'World' });
 */
export const trpc = createTRPCReact<AppRouter>();

/**
 * Type-safe tRPC client with React hooks
 * 
 * Available procedures:
 * - trpc.test.hello.useQuery({ name: string })
 * - trpc.test.healthCheck.useQuery()
 */
