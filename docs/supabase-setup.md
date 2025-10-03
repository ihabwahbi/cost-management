# Supabase Database Setup Guide

## Quick Reference

### Working Configuration (Free Plan)

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://bykrhpaqaxhyfrqfvbus.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
DATABASE_URL=postgresql://postgres.bykrhpaqaxhyfrqfvbus:Y%40seenH%40li2025@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

**Critical**: Use **Connection Pooler** (port 6543) for Supabase Free Plan due to IPv6 connectivity limitations.

## Connection String Format

### Free Plan (Connection Pooler - Port 6543)
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

### Paid Plan with IPv4 (Direct - Port 5432)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

## Password URL Encoding

**CRITICAL**: Special characters in passwords MUST be URL-encoded:

| Character | Encoded |
|-----------|---------|
| `@`       | `%40`   |
| `#`       | `%23`   |
| `$`       | `%24`   |
| `&`       | `%26`   |
| `+`       | `%2B`   |
| `/`       | `%2F`   |
| `=`       | `%3D`   |
| `?`       | `%3F`   |

**Example**: Password `Y@seenH@li2025` → `Y%40seenH%40li2025`

## Finding Your Connection String

### Option 1: Supabase Dashboard
1. Go to Project Settings → Database
2. Scroll to "Connection string" section
3. Select "Connection pooling" tab (for free plan)
4. Copy the URI and URL-encode the password

### Option 2: Using Helper Script
```bash
./check-and-fix-env.sh
```

This script will:
- Validate all required environment variables
- Check DATABASE_URL format
- Verify connection pooler usage (for free plan)
- Test database connectivity

## Architecture

### Current Stack
- **API Layer**: Next.js API Routes (`/api/trpc/*`)
- **Database Client**: Drizzle ORM with Postgres.js
- **Connection**: Direct from Next.js server to Supabase Postgres

### NOT Using
- ❌ Supabase Edge Functions
- ❌ Supabase Auth (currently)
- ❌ Supabase Realtime (currently)

## Common Issues & Solutions

### Issue: ENETUNREACH (IPv6 Unreachable)
**Symptom**: Error connecting to `2600:1f18:...` on port 5432

**Cause**: Free plan uses IPv6 for direct connections, but your system doesn't support it

**Solution**: Use Connection Pooler (port 6543) which resolves to IPv4
```bash
# Change from:
@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432

# To:
@aws-0-us-east-1.pooler.supabase.com:6543
```

### Issue: Authentication Failed
**Symptom**: Password authentication failed for user "postgres"

**Cause**: Special characters in password not URL-encoded

**Solution**: Encode special characters (@ → %40, # → %23, etc.)

### Issue: Changes Not Taking Effect
**Symptom**: Updated .env.local but still getting errors

**Cause**: Next.js only loads environment variables on startup

**Solution**: Restart the dev server
```bash
# Stop current server (Ctrl+C)
pnpm dev
```

### Issue: Cannot Find Module '@cost-mgmt/db'
**Symptom**: Module not found errors in API routes

**Cause**: Workspace dependencies not installed

**Solution**: 
```bash
pnpm install
pnpm build --filter=@cost-mgmt/db
```

## Testing Connection

### Quick Test
```bash
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect()
  .then(() => { console.log('✅ Connected'); client.end(); })
  .catch(err => { console.error('❌ Error:', err.message); });
"
```

### Comprehensive Test
```bash
./check-and-fix-env.sh
```

## Environment Variables Required

```bash
# apps/web/.env.local

# Supabase Project
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]

# Database Connection (use pooler for free plan)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[URL-ENCODED-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## Migration Notes

### When Upgrading from Free to Paid Plan
1. Can switch from Connection Pooler to Direct Connection
2. Change port from 6543 → 5432
3. Change hostname from pooler.supabase.com → db.PROJECT-REF.supabase.co
4. IPv4 will be available with dedicated add-on

### When Rotating Password
1. Generate new password in Supabase Dashboard
2. **URL-encode** the new password
3. Update DATABASE_URL in .env.local
4. Restart Next.js dev server
5. Verify connection with test script

## Resources

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
