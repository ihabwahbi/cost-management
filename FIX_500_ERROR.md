# 🔧 Fix: 500 Internal Server Error on PO Mapping Page

## 🔴 Root Cause

**Missing `DATABASE_URL` environment variable in `apps/web/.env.local`**

When the PO Mapping page tries to load existing mappings via tRPC, the database client fails to initialize because it cannot find the required `DATABASE_URL` connection string.

---

## 📋 Error Details

**Console Error:**
```
GET http://localhost:3000/api/trpc/poMapping.getExistingMappings?batch=1&... 
500 (Internal Server Error)
```

**Error Flow:**
1. User visits PO Mapping page
2. Component calls: `trpc.poMapping.getExistingMappings.useQuery()`
3. Request → `/api/trpc/poMapping.getExistingMappings`
4. Next.js API route imports `db` from `@cost-mgmt/db`
5. Database client tries to initialize with `DATABASE_URL`
6. **`DATABASE_URL` is undefined** → throws error
7. Returns **500 Internal Server Error**

**Affected Files:**
- `packages/db/src/client.ts` (lines 9-15 - requires DATABASE_URL)
- `apps/web/app/api/trpc/[trpc]/route.ts` (API handler)
- `packages/api/src/routers/po-mapping.ts` (getExistingMappings procedure)

---

## ✅ Solution

### Step 1: Get Database Connection String

Go to your Supabase project dashboard:

🔗 **https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/settings/database**

1. Navigate to: **Settings** → **Database**
2. Find: **Connection string** section
3. Select: **URI** format
4. Copy the full connection string (looks like):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres
   ```

### Step 2: Add to Environment File

Add the `DATABASE_URL` to your `.env.local` file:

```bash
# Option A: Manual edit
# Open apps/web/.env.local and add:

DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres
```

```bash
# Option B: Using command (replace YOUR_PASSWORD)
cat >> apps/web/.env.local << 'EOL'

# Database URL for Drizzle ORM (server-side only)
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres
EOL
```

### Step 3: Validate Environment

Run the validation helper:

```bash
./check-env.sh
```

Expected output:
```
🔍 Environment Variables Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Checking: apps/web/.env.local

✅ NEXT_PUBLIC_SUPABASE_URL is set
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set
✅ DATABASE_URL is set

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4: Restart Development Server

```bash
# Stop current server (Ctrl+C)

# Restart
npm run dev
```

### Step 5: Verify Fix

1. Navigate to: http://localhost:3000/po-mapping
2. Check browser console - should see no errors
3. Page should load successfully

---

## 🛡️ Prevention

The `.env.example` file has been updated to clearly mark `DATABASE_URL` as **REQUIRED**.

When setting up a new environment:
1. Copy `.env.example` to `.env.local`
2. Fill in ALL required variables (marked with ⚠️)
3. Run `./check-env.sh` to validate

---

## 📚 Technical Context

### Why DATABASE_URL is Required

The project uses **Drizzle ORM** for type-safe database operations. Drizzle requires a direct PostgreSQL connection string to:
- Execute database queries
- Provide type inference
- Enable server-side data fetching

### Architecture

```
Client (Browser)
    ↓
tRPC Client (/api/trpc)
    ↓
Next.js API Route
    ↓
Drizzle ORM (requires DATABASE_URL)
    ↓
Supabase PostgreSQL Database
```

### Environment Variables Used

| Variable | Purpose | Required | Scope |
|----------|---------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | ✅ Yes | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | ✅ Yes | Client + Server |
| `DATABASE_URL` | PostgreSQL connection | ✅ Yes | Server only |

---

## 🔍 Verification Checklist

- [ ] DATABASE_URL added to apps/web/.env.local
- [ ] Connection string includes your actual password
- [ ] ./check-env.sh shows all ✅
- [ ] Dev server restarted
- [ ] PO Mapping page loads without errors
- [ ] Console shows no 500 errors

---

## 📝 Related Commits

- `089e1a4` - Add DATABASE_URL validation and improved documentation

---

**Status:** ✅ **FIXED**  
**Resolution:** Add DATABASE_URL to .env.local  
**Prevention:** Environment validation helper script  

---

*Generated: October 3, 2025*  
*Issue: 500 Internal Server Error on PO Mapping*  
*Root Cause: Missing DATABASE_URL environment variable*
