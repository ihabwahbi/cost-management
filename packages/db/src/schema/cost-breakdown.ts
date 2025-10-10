import { pgTable, uuid, text, numeric, timestamp } from 'drizzle-orm/pg-core';
import { projects } from './projects';

/**
 * Cost Breakdown table schema
 * Budget line items for projects
 * Matches production Supabase schema
 */
export const costBreakdown = pgTable('cost_breakdown', {
  id: uuid('id').primaryKey().defaultRandom(),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id),
  subBusinessLine: text('sub_business_line').notNull(),
  costLine: text('cost_line').notNull(),
  spendType: text('spend_type').notNull(),
  spendSubCategory: text('spend_sub_category').notNull(),
  budgetCost: numeric('budget_cost').notNull().default('0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type exports
export type CostBreakdown = typeof costBreakdown.$inferSelect;
export type NewCostBreakdown = typeof costBreakdown.$inferInsert;
