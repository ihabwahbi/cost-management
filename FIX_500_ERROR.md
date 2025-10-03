# 🔧 Fix: 500 Internal Server Error on PO Mapping Page

## 🔴 Root Causes (Two Issues Found)

### Issue #1: Missing DATABASE_URL
**Missing `DATABASE_URL` environment variable in `apps/web/.env.local`**

When the PO Mapping page tries to load existing mappings via tRPC, the database client fails to initialize because it cannot find the required `DATABASE_URL` connection string.

### Issue #2: URL Encoding in Password (CRITICAL)
**Special characters in password must be URL-encoded**

If your password contains special characters like `@`, `#`, `$`, `&`, etc., they **MUST** be URL-encoded in the connection string:

- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `&` → `%26`

**Example:** Password `Y@seenH@li` becomes `Y%40seenH%40li` in the URL

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

### Quick Fix (Automated)

We've created an auto-fix script:

```bash
./check-and-fix-env.sh
```

This script will:
- ✅ Check if DATABASE_URL exists
- ✅ Detect unencoded special characters
- ✅ Automatically fix URL encoding (with backup)
- ✅ Verify configuration
- ✅ Show next steps

### Manual Fix

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

### Step 2: Add to Environment File (with URL Encoding)

**IMPORTANT:** URL-encode special characters in your password!

```bash
# Option A: Manual edit
# Open apps/web/.env.local and add:
# REMEMBER: Encode special characters (@→%40, #→%23, etc.)

DATABASE_URL=postgresql://postgres:[YOUR-URL-ENCODED-PASSWORD]@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres
```

**Example with password `Y@seenH@li`:**
```bash
# ❌ WRONG (will fail):
DATABASE_URL=postgresql://postgres:Y@seenH@li@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres

# ✅ CORRECT (@ encoded as %40):
DATABASE_URL=postgresql://postgres:Y%40seenH%40li@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres
```

### Step 3: Validate Environment

Run the auto-fix/validation script:

```bash
./check-and-fix-env.sh
```

This will:
- Check if DATABASE_URL exists
- Verify URL encoding is correct
- Auto-fix if needed (creates backup first)
- Show configuration summary

Expected output:
```
✅ DATABASE_URL is set
✅ Password is properly URL-encoded

📋 Configuration Summary:
  Supabase URL: ✅ https://...
  Database URL: ✅ Set with URL-encoded password
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
- [ ] **Special characters in password are URL-encoded (@→%40, etc.)**
- [ ] ./check-and-fix-env.sh shows all ✅
- [ ] Dev server restarted (**CRITICAL - env vars only load on startup**)
- [ ] PO Mapping page loads without errors
- [ ] Console shows no 500 errors

## 🐛 Troubleshooting

### Issue: Still getting 500 errors after adding DATABASE_URL

**Check #1: Did you restart the dev server?**
```bash
# Stop server: Ctrl+C
# Start server: npm run dev
```
Environment variables are only loaded when Next.js starts!

**Check #2: Is your password URL-encoded?**
```bash
./check-and-fix-env.sh
# This will auto-detect and fix encoding issues
```

**Check #3: Check Next.js server logs**
Look for the actual error in your terminal where `npm run dev` is running.

### Common URL Encoding Issues

| Character | URL Encoded | Example Password | Encoded Version |
|-----------|-------------|------------------|-----------------|
| `@` | `%40` | `P@ssw0rd` | `P%40ssw0rd` |
| `#` | `%23` | `Pass#123` | `Pass%23123` |
| `$` | `%24` | `P$ssw0rd` | `P%24ssw0rd` |
| `&` | `%26` | `P&ssword` | `P%26ssword` |
| `%` | `%25` | `P%ssword` | `P%25ssword` |
| `:` | `%3A` | `P:ssword` | `P%3Assword` |
| `/` | `%2F` | `P/ssword` | `P%2Fssword` |

---

## 📝 Related Commits

- `089e1a4` - Add DATABASE_URL validation and improved documentation
- `b64fd1e` - Add comprehensive fix guide for 500 error issue
- `16830d8` - Add auto-fix script for DATABASE_URL password encoding

---

**Status:** ✅ **FIXED**  
**Resolution:** Add DATABASE_URL to .env.local  
**Prevention:** Environment validation helper script  

---

*Generated: October 3, 2025*  
*Issue: 500 Internal Server Error on PO Mapping*  
*Root Cause: Missing DATABASE_URL environment variable*
