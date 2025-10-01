# Cost Management Hub

Living Blueprint Architecture implementation for enterprise cost management and tracking.

## 🏗️ Project Structure (Monorepo)

This project uses **Turborepo** for monorepo management with the following structure:

```
cost-management-hub/
├── apps/
│   └── web/                    # Next.js 14 application
├── packages/
│   ├── api/                    # tRPC API layer
│   ├── db/                     # Drizzle ORM + PostgreSQL schemas
│   ├── types/                  # Shared TypeScript types
│   └── ui/                     # Shared UI components (future)
├── tools/
│   ├── cell-validator/         # CLI for validating Component Cells
│   └── ledger-query/           # Query utilities for Architectural Ledger
├── supabase/functions/         # Supabase Edge Functions
├── docs/                       # Documentation and specs
└── ledger.jsonl               # Architectural Ledger
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8
- **Supabase** account with project setup

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp apps/web/.env.example apps/web/.env.local

# Add your Supabase credentials to apps/web/.env.local:
# NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
# NEXT_PUBLIC_TRPC_URL=https://[PROJECT-REF].supabase.co/functions/v1/trpc
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### Development

```bash
# Start all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Lint all packages
pnpm lint

# Type check all packages
pnpm type-check
```

### Specific Package Commands

```bash
# Run commands in specific workspace
pnpm --filter @cost-mgmt/web dev
pnpm --filter @cost-mgmt/api type-check
pnpm --filter @cost-mgmt/db db:studio

# Cell Validator CLI
cd tools/cell-validator
pnpm validate <cell-path>

# Database management
cd packages/db
pnpm db:studio          # Open Drizzle Studio
pnpm db:compare         # Validate schema definitions
```

## 📦 Packages

### [@cost-mgmt/web](./apps/web)
Next.js 14 application with:
- Project dashboard
- PO mapping interface
- Real-time metrics
- Supabase integration

### [@cost-mgmt/db](./packages/db)
Database layer featuring:
- Drizzle ORM for type-safe queries
- PostgreSQL schema definitions
- Supabase connection management
- Migration tools

### [@cost-mgmt/api](./packages/api)
tRPC API layer providing:
- End-to-end type safety
- Zod input validation
- Supabase Edge Function deployment
- Procedure-based architecture

### [@cost-mgmt/cell-validator](./tools/cell-validator)
CLI tool for Component Cell validation:
- Manifest.json validation
- Pipeline.yaml quality gates
- Structure compliance checks
- Behavioral assertion verification

### [@cost-mgmt/ledger-query](./tools/ledger-query)
Query utilities for the Architectural Ledger:
- Change history tracking
- Artifact search
- Dependency analysis
- Timeline queries

## 🗄️ Database

### Schema

The database schema is defined using Drizzle ORM with the following tables:

- **projects** - Project metadata
- **cost_breakdown** - Budget line items
- **pos** - Purchase orders
- **po_line_items** - PO line item details
- **po_mappings** - Maps POs to budget lines
- **forecast_versions** - Budget forecast versions
- **budget_forecasts** - Forecast amounts

See [docs/db-schema.md](./docs/db-schema.md) for complete schema.

### Migrations

```bash
# Generate migration from schema changes
pnpm --filter @cost-mgmt/db db:generate

# Push schema changes to database
pnpm --filter @cost-mgmt/db db:push

# Open Drizzle Studio (database GUI)
pnpm --filter @cost-mgmt/db db:studio
```

## 🔌 API (tRPC)

### Local Development

The tRPC API can be accessed through the Supabase Edge Function:

```bash
# Deploy Edge Function locally
supabase functions serve trpc

# Test endpoint
curl http://localhost:54321/functions/v1/trpc/test.hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

### Production Deployment

```bash
# Deploy to Supabase
supabase functions deploy trpc

# Set environment variables
supabase secrets set DATABASE_URL="postgresql://..."
```

See [supabase/functions/README.md](./supabase/functions/README.md) for detailed deployment instructions.

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @cost-mgmt/web test
pnpm --filter @cost-mgmt/cell-validator test

# Type check all packages
pnpm type-check
```

## 📖 Architecture

This project implements the **Living Blueprint Architecture** with three core pillars:

### 1. Type-Safe Data Layer
- PostgreSQL (Supabase) → Drizzle ORM → tRPC → React
- End-to-end type safety with zero gaps
- Runtime validation with Zod

### 2. Smart Component Cells
- Self-contained, validated components
- Data contracts via tRPC procedures
- Behavioral assertions for testing
- Quality gates in CI/CD pipeline

### 3. Architectural Ledger
- Append-only change log (ledger.jsonl)
- Complete audit trail
- AI agent context
- Impact analysis

See [docs/living-blueprint-architecture.md](./docs/living-blueprint-architecture.md) for full architecture details.

## 🔄 Migration & Rollback

### Migration Principles

✅ **ZERO DOWNTIME**
- All new infrastructure is additive
- Existing functionality unchanged
- Gradual migration path

✅ **VALIDATION BEFORE CUTOVER**
- Schema matches production exactly
- All tests pass
- Performance validated

✅ **ROLLBACK READY**
- New packages can be removed cleanly
- No breaking database changes
- Clear rollback procedures

### Rollback Procedures

#### Revert to Pre-Monorepo State

```bash
# 1. Checkout previous commit
git log  # Find commit before monorepo migration
git checkout [COMMIT_HASH]

# 2. Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install

# 3. Start app
pnpm dev
```

#### Remove Specific Package

```bash
# Remove package from workspace
rm -rf packages/[package-name]

# Update pnpm-workspace.yaml if needed
# Reinstall dependencies
pnpm install
```

## 📚 Documentation

- [Living Blueprint Architecture](./docs/living-blueprint-architecture.md)
- [Database Schema](./docs/db-schema.md)
- [Epic 001: Foundation Setup](./docs/epics/epic-001-living-blueprint-phase1.md)
- [Story 1.1: Foundation Setup](./docs/stories/1.1.foundation-setup.md)

## 🛠️ Tools & Technologies

**Frontend:**
- Next.js 14 (App Router)
- React 18
- TailwindCSS
- Radix UI
- Recharts

**Backend:**
- tRPC v10
- Drizzle ORM
- PostgreSQL (Supabase)
- Supabase Edge Functions

**Development:**
- TypeScript
- Turborepo
- pnpm workspaces
- Zod validation
- Vitest

## 📝 Scripts Reference

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in development mode |
| `pnpm build` | Build all packages and apps |
| `pnpm lint` | Lint all packages |
| `pnpm type-check` | Type check all packages |
| `pnpm clean` | Clean all build artifacts and node_modules |
| `pnpm test` | Run all tests |

## 🤝 Contributing

1. Check the [Architectural Ledger](./ledger.jsonl) for recent changes
2. Follow the Living Blueprint Architecture patterns
3. Validate Cells with `cell-validator`
4. Ensure all quality gates pass
5. Update ledger with your changes

## 📄 License

Proprietary - All rights reserved

## 🔗 Links

- [Supabase Dashboard](https://app.supabase.com)
- [Turborepo Docs](https://turbo.build/repo/docs)
- [tRPC Docs](https://trpc.io)
- [Drizzle ORM Docs](https://orm.drizzle.team)
