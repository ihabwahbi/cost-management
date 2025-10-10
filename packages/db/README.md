# @cost-mgmt/db

Type-safe database layer using Drizzle ORM for Supabase PostgreSQL.

## Overview

This package provides:
- **Drizzle ORM** - Type-safe database queries
- **Schema Definitions** - Auto-generated from production database
- **Type Inference** - Full TypeScript support from database to application
- **Migration Tools** - Database version control and migrations

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```bash
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

You can find your connection string in the Supabase dashboard under:
Settings → Database → Connection string → URI

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Verify Schema

The schema has been created based on the production database structure.
To verify against live database:

```bash
# Validate schema definitions
pnpm db:compare

# Introspect live database (requires DATABASE_URL)
pnpm db:introspect
```

## Available Scripts

- `pnpm db:generate` - Generate migrations from schema changes
- `pnpm db:push` - Push schema changes to database
- `pnpm db:studio` - Open Drizzle Studio (database GUI)
- `pnpm db:introspect` - Introspect existing database to generate schema
- `pnpm db:compare` - Validate schema definitions
- `pnpm type-check` - Run TypeScript type checking

## Usage

```typescript
import { db, schema } from '@cost-mgmt/db';

// Type-safe queries
const projects = await db.select().from(schema.projects);

// With type inference
const project = await db.query.projects.findFirst({
  where: (projects, { eq }) => eq(projects.id, projectId),
});
```

## Schema Structure

```
src/
├── schema/
│   ├── index.ts           # Schema exports
│   ├── projects.ts        # Projects table schema
│   ├── cost-breakdown.ts  # Cost breakdown table schema
│   ├── pos.ts             # Purchase orders table schema
│   └── po-line-items.ts   # PO line items table schema
├── migrations/            # Generated migration files
├── client.ts              # Database client configuration
└── index.ts               # Package exports
```

## Type Safety

All queries are fully type-safe from database to application:

```typescript
// ✅ Type-safe - knows all columns and types
const projects = await db.select({
  id: schema.projects.id,
  name: schema.projects.name,
}).from(schema.projects);

// ❌ TypeScript error - column doesn't exist
const invalid = await db.select({
  invalidColumn: schema.projects.invalidColumn, // Error!
}).from(schema.projects);
```

## Migration Status

**Current Status**: Schema definitions created and validated ✅

- [x] Schema created from production database schema (docs/db-schema.md)
- [x] Type definitions generated
- [x] Schema validation completed (pnpm db:compare)
- [ ] Database introspection with live connection (requires DATABASE_URL)

## Migration Workflow

### Creating Migrations

1. **Update Drizzle Schema**:
   ```typescript
   // packages/db/src/schema/table-name.ts
   export const tableName = pgTable('table_name', {
     // ... add/modify columns
   })
   ```

2. **Generate Migration**:
   ```bash
   pnpm db:generate --name descriptive_migration_name
   ```

3. **Review Generated SQL**:
   ```bash
   cat src/migrations/XXXX_descriptive_migration_name.sql
   ```

4. **Apply Migration**:
   ```bash
   pnpm db:push
   ```

5. **Commit Both Schema and Migration**:
   ```bash
   git add src/schema/ src/migrations/
   git commit -m "feat(db): Add [description]"
   ```

### Baseline Migration

- **File**: `0000_baseline_schema.sql`
- **Created**: 2025-10-10
- **Status**: Applied (represents current production state)
- **Do NOT re-run**: Already in database

### Future Migrations

All future schema changes MUST:
1. Update Drizzle schema first
2. Generate migration
3. Review SQL
4. Test on development
5. Apply to production
6. Commit schema + migration together

## Documentation

- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Supabase PostgreSQL Docs](https://supabase.com/docs/guides/database)
