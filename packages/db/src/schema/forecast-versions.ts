import { pgTable, uuid, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Forecast Versions table schema
 * Version control for budget forecasts
 * Matches production Supabase schema
 */
export const forecastVersions = pgTable('forecast_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  versionNumber: integer('version_number').notNull(),
  reasonForChange: text('reason_for_change').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  createdBy: text('created_by').default('system'),
});

// Type exports
export type ForecastVersion = typeof forecastVersions.$inferSelect;
export type NewForecastVersion = typeof forecastVersions.$inferInsert;
