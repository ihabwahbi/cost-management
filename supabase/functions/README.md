# Supabase Edge Functions

This directory contains Supabase Edge Functions for the Cost Management Hub.

## Functions

### `trpc` - tRPC API Handler

The main API endpoint that serves all tRPC procedures.

**URL**: `https://[PROJECT-REF].supabase.co/functions/v1/trpc`

## Prerequisites

1. **Supabase CLI** - Install from https://supabase.com/docs/guides/cli
2. **Supabase Project** - Active project with database setup
3. **Environment Variables** - See Setup section

## Setup

### 1. Install Supabase CLI

```bash
# macOS
brew install supabase/tap/supabase

# Others
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Project

```bash
supabase link --project-ref [YOUR-PROJECT-REF]
```

Find your project ref in Supabase Dashboard → Settings → General

### 4. Set Environment Variables

```bash
# Set DATABASE_URL for Edge Function
supabase secrets set DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

## Deployment

### Deploy All Functions

```bash
supabase functions deploy
```

### Deploy Specific Function

```bash
supabase functions deploy trpc
```

### View Deployment Status

```bash
supabase functions list
```

## Testing

### Test Locally

```bash
# Start local Supabase
supabase start

# Deploy function locally
supabase functions serve trpc

# Test endpoint
curl -X POST http://localhost:54321/functions/v1/trpc/test.hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

### Test Production

```bash
# Test health check
curl https://[PROJECT-REF].supabase.co/functions/v1/trpc/test.healthCheck

# Test hello procedure
curl -X POST https://[PROJECT-REF].supabase.co/functions/v1/trpc/test.hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'
```

## Environment Variables

Add these to your apps/web/.env.local:

```bash
# tRPC API Endpoint
NEXT_PUBLIC_TRPC_URL=https://[PROJECT-REF].supabase.co/functions/v1/trpc
```

## Monitoring

### View Logs

```bash
# Real-time logs
supabase functions logs trpc --follow

# Recent logs
supabase functions logs trpc
```

### View Metrics

Check Supabase Dashboard → Edge Functions → trpc for:
- Request count
- Error rate
- Latency
- Bandwidth usage

## Troubleshooting

### Function Not Responding

1. Check function is deployed: `supabase functions list`
2. Check logs: `supabase functions logs trpc`
3. Verify DATABASE_URL is set: `supabase secrets list`

### CORS Errors

The function includes CORS headers. If you still have issues:
1. Verify Origin header in request
2. Check browser console for specific error
3. Test with curl to isolate client-side issues

### Database Connection Issues

1. Verify DATABASE_URL format is correct
2. Check database is running: Supabase Dashboard → Database
3. Test connection with provided `healthCheck` procedure

## Documentation

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)
- [tRPC Server Adapters](https://trpc.io/docs/server/adapters)
