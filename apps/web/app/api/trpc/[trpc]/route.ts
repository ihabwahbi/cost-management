/**
 * tRPC API Route Handler for Next.js App Router
 * 
 * Serves the tRPC router from @cost-mgmt/api package
 * Handles all tRPC requests via fetchRequestHandler
 * 
 * Route: /api/trpc/*
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@cost-mgmt/api';
import { db } from '@cost-mgmt/db';
import type { Context } from '@cost-mgmt/api/src/trpc';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: (): Context => ({ db }),
  });

export { handler as GET, handler as POST };
