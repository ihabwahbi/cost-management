# Local Development Setup Implementation Plan

## Overview

Set up the local development environment for the cost management application downloaded from v0, enabling local development with full database functionality.

## Current State Analysis

The application is a Next.js 14 project with Supabase integration that was previously running on v0. Currently:
- Dependencies are not installed (no `node_modules` directory)
- No environment variables configured (missing `.env` files)
- Database connection not established
- Uses pnpm as package manager (has `pnpm-lock.yaml`)
- Contains SQL migration scripts in `scripts/` directory

### Key Discoveries:
- Package manager: pnpm (based on `pnpm-lock.yaml:1`)
- Database: Supabase PostgreSQL (based on `lib/supabase/client.ts:3`)
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 11 database migration scripts ready in `scripts/` directory

## Desired End State

A fully functional local development environment where:
- The Next.js application runs in development mode
- Database is connected and populated with schema
- All pages load without errors
- Mock data is available for testing

## What We're NOT Doing

- Migrating to Azure (that's a separate task)
- Setting up production deployment
- Implementing authentication (currently uses placeholder)
- Setting up CI/CD pipelines

## Implementation Approach

Use either Supabase Cloud (easier) or Supabase Local (more control) to provide the database backend, then configure the Next.js application to connect to it.

## Phase 1: Install Dependencies

### Overview
Install Node.js dependencies using pnpm package manager.

### Changes Required:

#### 1. Install pnpm (if not already installed)
**Command**: Check if pnpm is installed
```bash
pnpm --version
```

If not installed:
```bash
npm install -g pnpm
```

#### 2. Install project dependencies
**Command**: Install all dependencies
```bash
pnpm install
```

### Success Criteria:

#### Automated Verification:
- [x] pnpm is installed: `pnpm --version`
- [x] Dependencies installed: `ls node_modules | head -5`
- [x] No installation errors in console

#### Manual Verification:
- [x] `node_modules` directory exists and is populated
- [x] No peer dependency warnings

---

## Phase 2: Supabase Setup (Choose Option A or B)

### Option A: Supabase Cloud (Recommended for Quick Start)

#### 1. Create Supabase Project
1. Go to https://supabase.com
2. Create a free account/login
3. Create new project with:
   - Project name: "cost-management-dev"
   - Database password: (save this securely)
   - Region: Choose closest to you

#### 2. Get Connection Details
From Supabase Dashboard:
1. Go to Settings → API
2. Copy the `Project URL` (for NEXT_PUBLIC_SUPABASE_URL)
3. Copy the `anon public` key (for NEXT_PUBLIC_SUPABASE_ANON_KEY)

### Option B: Supabase Local (For Offline Development)

#### 1. Install Supabase CLI
```bash
# Install via npm
npm install -g supabase

# Or via Homebrew (macOS)
brew install supabase/tap/supabase
```

#### 2. Initialize Supabase Local
```bash
# Initialize Supabase in project
supabase init

# Start local Supabase
supabase start
```

This will output:
- `API URL` → use for NEXT_PUBLIC_SUPABASE_URL
- `anon key` → use for NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## Phase 3: Environment Configuration

### Overview
Create environment files with database connection details.

### Changes Required:

#### 1. Create .env.local file
**File**: `.env.local`
**Content**:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### 2. Create .env.example for reference
**File**: `.env.example`
**Content**:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Success Criteria:

#### Automated Verification:
- [x] .env.local file exists: `ls -la .env.local`
- [x] Environment variables are set: `grep NEXT_PUBLIC_SUPABASE_URL .env.local`

#### Manual Verification:
- [x] Both environment variables have valid values
- [x] No placeholder text remains

---

## Phase 4: Database Schema Setup

### Overview
Run SQL migration scripts to create database schema and seed data.

### Changes Required:

#### 1. Run migrations in order
Execute in Supabase SQL Editor (Dashboard → SQL Editor) or via CLI:

```sql
-- Run each file in order:
-- 1. scripts/001_create_projects_tables.sql
-- 2. scripts/003_create_po_tables.sql
-- 3. scripts/004_create_forecast_versioning_tables.sql
-- 4. scripts/005_update_po_schema.sql
-- 5. scripts/006_remove_project_dates_and_revenue.sql
-- 6. scripts/create_initial_forecast_function.sql

-- Then optionally seed with sample data:
-- 7. scripts/002_seed_shell_crux_project.sql
-- 8. scripts/004_seed_sample_pos.sql
-- 9. scripts/006_populate_po_data.sql
```

#### 2. For Supabase Cloud:
1. Go to SQL Editor in Dashboard
2. Copy contents of each SQL file
3. Run in order
4. Check for errors after each script

#### 3. For Supabase Local:
```bash
# Run migrations via CLI
cat scripts/001_create_projects_tables.sql | supabase db push
cat scripts/003_create_po_tables.sql | supabase db push
# ... continue for all scripts
```

### Success Criteria:

#### Automated Verification:
- [x] Tables created successfully (check in Supabase Dashboard → Table Editor)
- [x] No SQL errors during migration

#### Manual Verification:
- [x] All 6 core tables exist: projects, cost_breakdown, pos, po_line_items, po_mappings, forecast_versions
- [x] Sample data is visible (if seed scripts were run)

---

## Phase 5: Start Development Server

### Overview
Launch the Next.js development server and verify application functionality.

### Changes Required:

#### 1. Start the development server
```bash
pnpm dev
```

Expected output:
```
▲ Next.js 14.2.16
- Local: http://localhost:3000
✓ Ready
```

#### 2. Open browser
Navigate to: http://localhost:3000

### Success Criteria:

#### Automated Verification:
- [x] Server starts without errors: `pnpm dev`
- [x] No console errors about missing environment variables
- [x] TypeScript compilation successful

#### Manual Verification:
- [x] Dashboard page loads at http://localhost:3000
- [x] Navigation menu is visible
- [x] Can navigate to Projects page (/projects)
- [x] Can navigate to PO Mapping page (/po-mapping)
- [x] No database connection errors in browser console

---

## Phase 6: Verify Core Functionality

### Overview
Test that core features work with the database connection.

### Manual Testing Steps:

1. **Test Dashboard**:
   - Verify metrics cards display (may show 0 if no data)
   - Check that navigation cards are clickable

2. **Test Projects Page**:
   - Click "New Project" button
   - Try creating a test project
   - Verify it appears in the list
   - Test expanding project to see cost breakdown

3. **Test PO Mapping Page**:
   - Check if PO list loads (empty or with seed data)
   - Test filter sidebar functionality
   - If seed data exists, try selecting a PO

4. **Check Browser Console**:
   - Open DevTools (F12)
   - Look for any red errors
   - Verify Supabase requests return 200 status

### Success Criteria:

#### Manual Verification:
- [ ] All pages load without errors
- [ ] Can create new projects
- [ ] Database operations work (create, read, update)
- [ ] No console errors about missing tables
- [ ] UI components render correctly

---

## Testing Strategy

### Quick Smoke Test:
1. Start dev server: `pnpm dev`
2. Open http://localhost:3000
3. Click through all main navigation items
4. Open browser console and check for errors

### Database Connection Test:
1. Go to Projects page
2. Click "New Project"
3. Fill in sample data
4. Click Save
5. Verify project appears in list

### Manual Testing Checklist:
- [ ] Dashboard loads with metrics
- [ ] Projects page shows list/empty state
- [ ] PO Mapping page loads filters
- [ ] Can create new project
- [ ] Can expand project details
- [ ] No JavaScript errors in console

## Troubleshooting Guide

### Common Issues:

#### 1. "Failed to connect to database"
- Verify .env.local has correct values
- Check Supabase project is running
- Ensure anon key is complete (very long string)

#### 2. "Table does not exist" errors
- Run migration scripts in order
- Check SQL Editor for migration errors
- Verify all tables exist in Table Editor

#### 3. "Module not found" errors
```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

#### 4. Port 3000 already in use
```bash
# Use different port
pnpm dev -- -p 3001
```

#### 5. Tailwind styles not working
- Check that `globals.css` is imported in `app/layout.tsx`
- Restart dev server

## Performance Considerations

- Initial load may be slow due to Tailwind CSS compilation
- Supabase free tier has connection limits (consider local for heavy development)
- Dev mode is not optimized - use `pnpm build && pnpm start` for performance testing

## Migration Notes

If you have existing data in v0:
1. Export data from v0 Supabase (if accessible)
2. Import into new Supabase instance
3. Or use seed scripts for test data

## References

- Supabase Documentation: https://supabase.com/docs
- Next.js Documentation: https://nextjs.org/docs
- Project structure analysis: `docs/research/2025-09-17_19-23-33_codebase_architecture.md`