# @cost-mgmt/api

Type-safe tRPC API layer for Cost Management Hub.

## Overview

This package provides:
- **tRPC v10+** - End-to-end type-safe APIs
- **Zod Validation** - Runtime input validation
- **Database Integration** - Direct access to Drizzle ORM
- **Type Inference** - Automatic type propagation to clients

## Architecture

```
tRPC Client (Frontend)
    ↓ [Type-safe calls with autocomplete]
tRPC Router (Edge Function)
    ↓ [Zod validation + business logic]
Drizzle ORM (@cost-mgmt/db)
    ↓ [Type-safe queries]
PostgreSQL (Supabase)
```

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Type Check

```bash
pnpm type-check
```

## Usage

### Creating a New Procedure

```typescript
// src/routers/projects.ts
import { z } from 'zod';
import { router, publicProcedure } from '../trpc';

export const projectsRouter = router({
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ input, ctx }) => {
      const project = await ctx.db.query.projects.findFirst({
        where: (projects, { eq }) => eq(projects.id, input.id),
      });
      return project;
    }),
});
```

### Adding Router to App

```typescript
// src/index.ts
import { projectsRouter } from './routers/projects';

export const appRouter = router({
  test: testRouter,
  projects: projectsRouter, // Add new router
});
```

## Available Routers

### Test Router (`test`)

Simple test procedures for validating tRPC setup:

- `test.hello` - Returns greeting message
- `test.healthCheck` - Checks API and database health

## Type Safety

The API package exports `AppRouter` type for client-side usage:

```typescript
// Client-side (apps/web)
import type { AppRouter } from '@cost-mgmt/api';

const trpc = createTRPCProxyClient<AppRouter>({
  // ... configuration
});

// ✅ Full type safety and autocomplete
const result = await trpc.test.hello.query({ name: 'World' });
//    ^? { message: string; timestamp: string }
```

## Deployment

This package is deployed as a Supabase Edge Function. See Task 5 for deployment setup.

## Project Structure

```
src/
├── routers/          # API route handlers
│   └── test.ts       # Test/health check procedures
├── procedures/       # Reusable procedure logic (future)
├── trpc.ts           # tRPC instance and configuration
└── index.ts          # Main app router and exports
```

## Future Enhancements

- [ ] Authentication middleware for protected procedures
- [ ] Rate limiting
- [ ] Caching layer
- [ ] WebSocket support for real-time updates
- [ ] OpenAPI documentation generation

## Documentation

- [tRPC Documentation](https://trpc.io/)
- [Zod Documentation](https://zod.dev/)
