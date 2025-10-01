import { pgTable, uuid, numeric, timestamp } from 'drizzle-orm/pg-core';
import { forecastVersions } from './forecast-versions';
import { costBreakdown } from './cost-breakdown';

/**
 * Budget Forecasts table schema
 * Forecast amounts for cost breakdown line items
 * Matches production Supabase schema
 */
export const budgetForecasts = pgTable('budget_forecasts', {
  id: uuid('id').primaryKey().defaultRandom(),
  forecastVersionId: uuid('forecast_version_id')
    .notNull()
    .references(() => forecastVersions.id),
  costBreakdownId: uuid('cost_breakdown_id')
    .notNull()
    .references(() => costBreakdown.id),
  forecastedCost: numeric('forecasted_cost').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Type exports
export type BudgetForecast = typeof budgetForecasts.$inferSelect;
export type NewBudgetForecast = typeof budgetForecasts.$inferInsert;
