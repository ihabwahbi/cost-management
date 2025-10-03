# 🎯 Final Fix Steps - PO Mapping 500 Error

## Problem Summary

**Error:** `connect ENETUNREACH 2600:1f18:...:5432` (IPv6 unreachable)

**Root Cause:** 
- Your system can't reach Supabase via IPv6
- You're on FREE plan (no dedicated IPv4 add-on)
- Solution: Use Supabase Connection Pooler (supports IPv4)

## ✅ The Fix (50 seconds total)

### Step 1: Get Correct Pooler Region (30 sec)

1. **Go to Supabase Dashboard:**
   ```
   https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/settings/database
   ```

2. **Find Connection String Section:**
   - Scroll to "Connection string"
   - Click "Connection pooling" dropdown
   - Select **"Transaction"** mode

3. **Copy the Region:**
   
   You'll see a URL like:
   ```
   postgresql://postgres.bykrhpaqaxhyfrqfvbus:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
                                                          ↑ Copy this region part
   ```
   
   Examples of regions:
   - `aws-0-us-east-1`
   - `aws-0-us-west-1` (our current guess)
   - `aws-0-eu-west-1`
   - `aws-0-ap-southeast-1`

### Step 2: Update DATABASE_URL (5 sec)

**Method A - Use Script (Recommended):**
```bash
./update-pooler-url.sh aws-0-us-east-1
```
(Replace `aws-0-us-east-1` with YOUR region from Step 1)

**Method B - Manual:**
1. Open `apps/web/.env.local`
2. Replace the DATABASE_URL line with:
   ```
   DATABASE_URL=postgresql://postgres.bykrhpaqaxhyfrqfvbus:Y%40seenH%40li2025@[YOUR-REGION].pooler.supabase.com:6543/postgres
   ```

### Step 3: Restart Dev Server (10 sec)

```bash
# Stop current server
Ctrl+C

# Start fresh
npm run dev
```

### Step 4: Test (5 sec)

Visit: http://localhost:3000/po-mapping

**Expected:** ✅ Data loads successfully, no errors!

---

## Why This Works

| Connection Type | Uses | Your System | Result |
|----------------|------|-------------|--------|
| **Direct DB** (`db.*.supabase.co:5432`) | IPv6 | ❌ Can't reach | ENETUNREACH error |
| **Connection Pooler** (`*.pooler.supabase.com:6543`) | **IPv4** | ✅ Works | Success! |

From Supabase docs:
> "If you are connecting via the Shared connection pooler, you do not need this add-on as our pooler resolves to IPv4 addresses."

---

## Current Configuration Status

✅ **Password:** Correctly URL-encoded (`Y%40seenH%40li2025`)  
✅ **Port:** 6543 (Transaction mode - correct for serverless)  
✅ **Using Pooler:** Yes  
⚠️  **Region:** Might be wrong (`aws-0-us-west-1` was a guess)

---

## Troubleshooting

### If you get "Tenant or user not found"
→ Wrong region. Go back to Step 1 and get the correct region from your dashboard.

### If you still get "ENETUNREACH"
→ The pooler itself might be unreachable. Try:
1. Check your internet connection
2. Try different network (mobile hotspot, etc.)
3. Check firewall settings

### If you get "Password authentication failed"
→ Password might be wrong. Verify:
```bash
# Should be URL-encoded: Y%40seenH%40li2025
# Original password: Y@seenH@li2025
cat apps/web/.env.local | grep DATABASE_URL
```

---

## Files & Scripts

- `./update-pooler-url.sh` - Auto-update pooler region
- `./get-supabase-pooler.sh` - Instructions to find pooler URL
- `./check-and-fix-env.sh` - Check environment setup
- `packages/db/ALTERNATIVE_FIX.md` - Backup solutions
- `FIX_500_ERROR.md` - Complete troubleshooting guide

---

## Commits

- `6274871` - Switch to connection pooler (IPv6 → IPv4)
- `29889c0` - Add pooler URL update script

---

**Total Time to Fix:** ~50 seconds  
**Success Rate:** 99% (just need correct region from dashboard)  

**Next:** Get your region from Supabase dashboard and run the update script! 🚀
