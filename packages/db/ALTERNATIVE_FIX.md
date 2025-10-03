# Alternative Fix: Force IPv4 on Direct Connection

If the connection pooler doesn't work (wrong region), you can force the
postgres client to use IPv4 instead of IPv6.

## Option 1: Use Connection Pooler (Recommended)

Get the correct pooler URL from Supabase Dashboard:
→ Settings → Database → Connection Pooling → Transaction mode

Example:
```
DATABASE_URL=postgresql://postgres.bykrhpaqaxhyfrqfvbus:Y%40seenH%40li2025@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Option 2: Force IPv4 on Direct Connection

If you must use direct connection, modify `packages/db/src/client.ts`:

```typescript
const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  connection: {
    application_name: 'cost-management',
  },
  // Force IPv4 by setting host options
  host_preference: 'ipv4',  // Try this first
});
```

Or use a more direct approach - change the hostname to IPv4:

```bash
# In .env.local, replace:
db.bykrhpaqaxhyfrqfvbus.supabase.co

# With IPv4 address (find via nslookup):
nslookup db.bykrhpaqaxhyfrqfvbus.supabase.co
# Use the IPv4 address shown
```

## Option 3: Use pgBouncer Pooler (Session Mode)

```
DATABASE_URL=postgresql://postgres.bykrhpaqaxhyfrqfvbus:Y%40seenH%40li2025@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

Note: Port 5432 for session mode (longer connections)
      Port 6543 for transaction mode (serverless/short connections)

## Current Status

✅ Password correctly URL-encoded: Y%40seenH%40li2025
✅ Using pooler: aws-0-us-west-1.pooler.supabase.com:6543
⏳ Need to verify region is correct

## Next Steps

1. Restart dev server
2. Check terminal output
3. If "Tenant or user not found" → Wrong region, get correct one from dashboard
4. If still "ENETUNREACH" → Try Option 2 or 3 above
