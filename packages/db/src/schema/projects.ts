import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Projects table schema
 * Matches production Supabase schema
 */
export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subBusinessLine: text('sub_business_line').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type exports
export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;
