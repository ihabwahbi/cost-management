import { pgTable, uuid, numeric, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { costBreakdown } from './cost-breakdown';
import { poLineItems } from './po-line-items';

/**
 * PO Mappings table schema
 * Maps PO line items to cost breakdown budget lines
 * Matches production Supabase schema
 */
export const poMappings = pgTable('po_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  poLineItemId: uuid('po_line_item_id')
    .notNull()
    .references(() => poLineItems.id),
  costBreakdownId: uuid('cost_breakdown_id')
    .notNull()
    .references(() => costBreakdown.id),
  mappedAmount: numeric('mapped_amount').notNull(),
  mappingNotes: text('mapping_notes'),
  mappedBy: varchar('mapped_by'),
  mappedAt: timestamp('mapped_at', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// Type exports
export type POMapping = typeof poMappings.$inferSelect;
export type NewPOMapping = typeof poMappings.$inferInsert;
