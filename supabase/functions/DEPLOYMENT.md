# tRPC Edge Function Deployment Guide

## Prerequisites

- Access to Supabase Dashboard: https://supabase.com/dashboard
- Your project: `bykrhpaqaxhyfrqfvbus`

## Deployment Steps

### Option 1: Deploy via Supabase Dashboard (Easiest)

1. **Go to Edge Functions**
   - Navigate to: https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/functions
   - Click "Deploy a new function" or "Create function"

2. **Create Function**
   - Function name: `trpc`
   - Click "Create function"

3. **Upload Files**
   - Upload `supabase/functions/trpc/index.ts`
   - Upload `supabase/functions/trpc/deno.json`

4. **Set Environment Variables**
   - Go to Project Settings > Edge Functions > Environment Variables
   - Add: `DATABASE_URL` = Your Postgres connection string
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres`
   - Get your password from Project Settings > Database > Connection String

5. **Deploy**
   - Click "Deploy" button
   - Wait for deployment to complete (usually 30-60 seconds)

6. **Verify Deployment**
   - Function URL: `https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc`
   - Test with: `https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/test.healthCheck`

### Option 2: Deploy via Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref bykrhpaqaxhyfrqfvbus

# Set environment variables (create .env file in supabase/)
echo "DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.bykrhpaqaxhyfrqfvbus.supabase.co:5432/postgres" > supabase/.env

# Deploy function
supabase functions deploy trpc --no-verify-jwt

# View logs
supabase functions logs trpc --follow
```

## Testing the Deployment

### Test 1: Health Check

```bash
curl https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/test.healthCheck
```

Expected response:
```json
{
  "result": {
    "data": {
      "status": "healthy",
      "timestamp": "2025-10-01T...",
      "database": "connected"
    }
  }
}
```

### Test 2: Hello World

```bash
curl "https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/test.hello?input=%7B%22json%22%3A%7B%22name%22%3A%22World%22%7D%7D"
```

Expected response:
```json
{
  "result": {
    "data": {
      "message": "Hello World!",
      "timestamp": "2025-10-01T..."
    }
  }
}
```

### Test 3: KPI Metrics (requires valid project UUID)

```bash
curl "https://bykrhpaqaxhyfrqfvbus.supabase.co/functions/v1/trpc/dashboard.getKPIMetrics?input=%7B%22json%22%3A%7B%22projectId%22%3A%22YOUR-PROJECT-UUID%22%7D%7D"
```

Expected response:
```json
{
  "result": {
    "data": {
      "budgetTotal": 150000,
      "committed": 120000,
      "variance": 30000,
      "variancePercent": 20
    }
  }
}
```

## Troubleshooting

### Error: "DATABASE_URL is not set"
- **Solution**: Add `DATABASE_URL` environment variable in Supabase Dashboard
- Go to: Project Settings > Edge Functions > Environment Variables

### Error: "Connection refused" or "Connection timeout"
- **Solution**: Check your database password and connection string
- Verify: Project Settings > Database > Connection String

### Error: "tRPC Error: INTERNAL_SERVER_ERROR"
- **Solution**: Check function logs in Supabase Dashboard
- Go to: Edge Functions > trpc > Logs

### Function deployed but not responding
- **Solution**: Wait 1-2 minutes for cold start, then retry
- Edge Functions have a ~30 second cold start on first request

## Enable in Web App

After successful deployment, enable the feature flag:

```bash
# In apps/web/.env.local
NEXT_PUBLIC_FEATURE_KPI_CARD_V2=enabled
```

Restart your dev server:
```bash
npm run dev
```

Navigate to `/projects/[id]/dashboard` to see the new KPICardV2 Cell!

## Monitoring

- **Logs**: https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/functions/trpc/logs
- **Metrics**: https://supabase.com/dashboard/project/bykrhpaqaxhyfrqfvbus/functions/trpc/metrics
- **Invocations**: Track function calls and errors in real-time

## Rollback

If issues occur:

1. **Disable feature flag** (instant rollback):
   ```bash
   # In apps/web/.env.local
   NEXT_PUBLIC_FEATURE_KPI_CARD_V2=disabled
   ```

2. **Or delete the function**:
   - Go to Edge Functions > trpc > Settings
   - Click "Delete function"

3. **Or deploy previous version**:
   - Edge Functions > trpc > Deployments
   - Click "Rollback" on previous version
