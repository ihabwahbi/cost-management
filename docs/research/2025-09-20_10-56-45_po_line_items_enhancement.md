---
date: 2025-09-20T10:56:45+08:00
researcher: iwahbi
git_commit: 78247acda698aded5de178022743bc4876e115cb
branch: main
repository: cost-management-v0
topic: "PO Line Items Enhancement and Dashboard Visualization"
tags: [research, codebase, po-management, dashboard, invoicing, supplier-tracking]
status: complete
last_updated: 2025-09-20
last_updated_by: iwahbi
---

# Research: PO Line Items Enhancement and Dashboard Visualization

**Date**: 2025-09-20T10:56:45+08:00
**Researcher**: iwahbi
**Git Commit**: 78247acda698aded5de178022743bc4876e115cb
**Branch**: main
**Repository**: cost-management-v0

## Research Question
Enhance the PO line items table with additional columns (Invoiced Quantity, Invoiced Value (USD), Invoice Date, Supplier Promise Date) and improve the project dashboard to visualize total PO value vs budget, actual invoiced amounts, and open PO values with supplier promise dates.

## Summary
The current system has a robust PO management structure with line items and cost breakdown mappings, but lacks invoice tracking and supplier promise date capabilities. The dashboard already has excellent visualization components but needs enhancement to differentiate between invoiced and open PO amounts. The implementation will require:
1. Database schema updates to add four new columns to po_line_items table
2. Data migration to populate existing records with the provided invoice data
3. Dashboard metrics calculation updates to use actual invoice data instead of mocked percentages
4. New UI components to visualize invoice timeline and supplier promise dates
5. Enhanced KPI cards to show the three-tier financial status (Budget vs Total PO vs Invoiced)

## Detailed Findings

### Current PO Table Structure
- **Location**: [`scripts/005_update_po_schema.sql:20-30`](scripts/005_update_po_schema.sql#L20)
- Current po_line_items table has: id, po_id, line_item_number, part_number, description, quantity, uom, line_value, created_at
- Missing columns: invoiced_quantity, invoiced_value_usd, invoice_date, supplier_promise_date
- Table uses UUID primary keys with foreign key cascade to pos table
- Indexed on po_id for performance

### Dashboard Architecture
- **Main Dashboard**: [`app/projects/[id]/dashboard/page.tsx`](app/projects/[id]/dashboard/page.tsx)
- **Metrics Calculation**: [`lib/dashboard-metrics.ts:22-127`](lib/dashboard-metrics.ts#L22)
- Currently mocks invoice data at 60% (`lib/dashboard-metrics.ts:92`)
- Has real-time subscription system for po_mappings and cost_breakdown changes
- Uses KPICard components with color-coded status indicators

### Existing UI Components
- **KPICard**: [`components/dashboard/kpi-card.tsx:15-68`](components/dashboard/kpi-card.tsx#L15)
  - Supports currency, percentage, and number formatting
  - Has trend indicators and color coding
  - Responsive with hover effects
  
- **BudgetTimelineChart**: [`components/dashboard/budget-timeline-chart.tsx:32-88`](components/dashboard/budget-timeline-chart.tsx#L32)
  - Composite chart with Area, Line, and Bar
  - Shows Budget vs Actual vs Forecast
  - Can be enhanced to show invoice timeline

- **ProjectAlerts**: [`components/dashboard/project-alerts.tsx:37-190`](components/dashboard/project-alerts.tsx#L37)
  - Has alert types for budget_exceeded, unusual_activity
  - Triggers at 75%, 90%, and 100% utilization thresholds
  - Can be extended for supplier promise date alerts

### Database Migration Patterns
- **Pattern Found**: [`scripts/005_update_po_schema.sql`](scripts/005_update_po_schema.sql)
  - Uses DROP TABLE and recreate for major changes
  - Alternative pattern in `scripts/006_remove_project_dates_and_revenue.sql` uses ALTER TABLE
  - Naming convention: numbered prefix (001_, 002_, etc.) for execution order
  - Indexes created immediately after table creation

### Data Flow Integration Points
1. **PO Data Fetching**: [`app/po-mapping/page.tsx:59-103`](app/po-mapping/page.tsx#L59)
   - Fetches POs, line items, and mappings separately
   - Combines into unified PO objects
   
2. **Dashboard Metrics**: [`lib/dashboard-metrics.ts:51-103`](lib/dashboard-metrics.ts#L51)
   - Aggregates mapped amounts from po_mappings
   - Calculates actualSpend, invoicedAmount, openOrders
   - Currently uses hardcoded 60% for invoice simulation

3. **Real-time Updates**: [`app/projects/[id]/dashboard/page.tsx:125-155`](app/projects/[id]/dashboard/page.tsx#L125)
   - Supabase channels for project-specific updates
   - Listens to po_mappings and cost_breakdown changes
   - Auto-refresh on data changes

## Architecture Insights

### Three-Tier Financial Status Model
The enhancement requires a three-tier financial tracking system:
1. **Budget Level**: Original approved budget from cost_breakdown table
2. **Committed Level**: Total PO value representing committed spend
3. **Actual Level**: Invoiced amounts that have hit the books

### Timeline-Based Visualization
Two critical date dimensions:
1. **Invoice Date**: When costs actually hit the books (historical)
2. **Supplier Promise Date**: When open POs will be delivered (future projection)

### Current Mock vs Required Implementation
- Current: `invoicedAmount = actualSpend * 0.6` (mock)
- Required: `invoicedAmount = SUM(po_line_items.invoiced_value_usd WHERE invoice_date <= today)`
- Required: `openOrders = SUM(line_value - invoiced_value_usd WHERE invoiced_value_usd < line_value)`

### UI/UX Best Practices for Financial Dashboards
Based on the existing patterns and requirements:

1. **Progressive Disclosure**
   - Summary KPIs at top level
   - Expandable sections for detail
   - Drill-down from totals to line items

2. **Visual Hierarchy**
   - Use size and color to indicate importance
   - Critical alerts (overbudget) in red
   - Warnings (>90% utilization) in yellow
   - Normal status in blue/green

3. **Timeline Visualization**
   - Stacked area chart for budget layers
   - Dotted lines for projections
   - Solid lines for actuals
   - Markers for key dates (invoices, promises)

4. **Status Indicators**
   - Progress bars with percentage
   - Color-coded badges
   - Trend arrows for changes
   - Icons for quick recognition

## Code References
- `scripts/005_update_po_schema.sql:20-30` - Current po_line_items table structure
- `lib/dashboard-metrics.ts:88-95` - Invoice calculation logic to update
- `app/projects/[id]/dashboard/page.tsx:286-330` - KPI cards section to enhance
- `components/dashboard/budget-timeline-chart.tsx` - Chart to extend with invoice timeline
- `components/dashboard/project-alerts.tsx:47-128` - Alert logic to extend for promise dates
- `app/po-mapping/page.tsx:59-103` - PO data fetching to include new fields
- `scripts/006_populate_po_data.sql` - Sample data population pattern

## Migration Script Requirements

### 1. Schema Update
```sql
ALTER TABLE public.po_line_items
ADD COLUMN invoiced_quantity DECIMAL(10,2),
ADD COLUMN invoiced_value_usd DECIMAL(15,2),
ADD COLUMN invoice_date DATE,
ADD COLUMN supplier_promise_date DATE;

-- Create indexes for performance
CREATE INDEX idx_po_line_items_invoice_date ON public.po_line_items(invoice_date);
CREATE INDEX idx_po_line_items_supplier_promise_date ON public.po_line_items(supplier_promise_date);
```

### 2. Data Population
The provided data needs to be mapped to existing line items using po_number and line_item_number as keys.

## Dashboard Enhancement Requirements

### New KPI Metrics
1. **Total PO Value**: Sum of all mapped PO line items
2. **Invoiced Amount**: Sum of invoiced_value_usd where invoice_date is not null
3. **Open PO Value**: Total PO Value - Invoiced Amount
4. **Promise Date Distribution**: Group open POs by supplier_promise_date month

### New Visualizations
1. **Three-Tier Progress Bar**
   - Budget (100% width, light background)
   - Total PO Value (overlay, medium color)
   - Invoiced Amount (overlay, dark color)

2. **Invoice Timeline Chart**
   - Monthly breakdown of invoiced amounts
   - Projection based on supplier promise dates
   - Cumulative view option

3. **Open PO Calendar**
   - Heat map showing promise dates
   - Drill-down to specific POs
   - Alert indicators for overdue deliveries

### Alert Enhancements
- Alert when supplier promise date is past due
- Warning when open POs exceed remaining budget
- Notification for large upcoming deliveries

## Related Research
- [`docs/research/2025-09-19_15-07-50_project_dashboard_design.md`](docs/research/2025-09-19_15-07-50_project_dashboard_design.md) - Previous dashboard design research
- [`docs/plans/2025-09-19-project-dashboard-implementation.md`](docs/plans/2025-09-19-project-dashboard-implementation.md) - Dashboard implementation plan

## Open Questions
1. Should we track partial invoicing (multiple invoices per line item)?
2. How to handle currency conversion if invoices are in different currencies?
3. Should supplier promise dates be updateable when delays occur?
4. Do we need approval workflows for invoice data entry?
5. Should we maintain invoice history for audit purposes?