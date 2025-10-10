import { defineConfig } from 'drizzle-kit';

// Migration tracking enabled: 2025-10-10
// Baseline: 0000_baseline_schema.sql (represents current production state)
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './src/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
