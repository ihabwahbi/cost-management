---
date: 2025-09-20T10:56:45+08:00
researcher: iwahbi
git_commit: 78247acda698aded5de178022743bc4876e115cb
branch: main
repository: cost-management-v0
topic: "PO Line Items Enhancement and Dashboard Visualization"
tags: [research, codebase, po-management, dashboard, invoicing, supplier-tracking, p&l-tracking]
status: complete
last_updated: 2025-09-20T19:13:33+08:00
last_updated_by: iwahbi
last_updated_note: "Clarified P&L impact and financial tracking concepts"
---

# Research: PO Line Items Enhancement and Dashboard Visualization

**Date**: 2025-09-20T10:56:45+08:00
**Researcher**: iwahbi
**Git Commit**: 78247acda698aded5de178022743bc4876e115cb
**Branch**: main
**Repository**: cost-management-v0

## Research Question
Enhance the PO line items table with additional columns (Invoiced Quantity, Invoiced Value (USD), Invoice Date, Supplier Promise Date) and improve the project dashboard to visualize total PO value vs budget, actual invoiced amounts, and open PO values with supplier promise dates.

## Financial Concepts Clarification

### Key Field Definitions

#### Invoice Value & Invoice Date
- **What they represent**: The moment when costs are **recognized in the financial books** (P&L statement)
- **Why it matters**: When a PO gets invoiced, this value appears in the **net income statement** for that specific cost line
- **Impact**: This is the **actual cost** that affects the P&L - not when PO is issued, but when invoiced
- **Example**: A $100K PO issued in January but invoiced in March only hits the P&L in March

#### Supplier Promise Date
- **What it represents**: The **expected future invoice date** for open (uninvoiced) PO items
- **Why it matters**: Provides visibility into **when open PO values will hit the P&L**
- **Impact**: Enables proactive financial planning by forecasting future P&L impacts
- **Example**: A $50K open PO with promise date of October 15th indicates when this cost will likely affect the P&L

### Financial Tracking Hierarchy

The system needs to track three distinct financial states:

1. **Budgeted Amount**: Approved budget allocation for the project
2. **Committed Amount (Total PO Value)**: Purchase orders issued but not necessarily invoiced
3. **Actual Cost (Invoiced Amount)**: Costs that have hit the P&L through supplier invoices

The critical insight is that **only invoiced amounts represent actual costs** in financial reporting. Open POs represent future liabilities that will become actual costs when invoiced.

## Summary
The current system has a robust PO management structure with line items and cost breakdown mappings, but lacks critical P&L tracking capabilities. The dashboard needs enhancement to track the complete financial lifecycle: from budget through committed POs to actual costs hitting the P&L. The implementation will require:

1. **Database schema updates** to add four new columns to po_line_items table for P&L tracking
2. **Data migration** to populate existing records with invoice and promise date information
3. **Dashboard metrics calculation** updates to track actual P&L impact vs committed spend
4. **P&L Timeline Visualization** showing when costs have hit and will hit the books
5. **Three-tier financial status** showing Budget vs Committed (PO) vs Actual (P&L) amounts

The core business value is enabling users to see:
- How much budget they have allocated
- How much has been committed through POs
- How much has **actually hit the P&L** (invoiced amounts)
- When the remaining open PO value will **impact future P&L statements** (via supplier promise dates)

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

### Three-Tier Financial Status Model (P&L Focused)
The enhancement requires a three-tier financial tracking system aligned with P&L reporting:

1. **Budget Level**: Original approved budget from cost_breakdown table
   - Represents: Financial allocation/limit
   - Source: cost_breakdown.budget_cost
   
2. **Committed Level**: Total PO value representing committed spend
   - Represents: Contractual obligations (not yet P&L impact)
   - Source: po_line_items.line_value (all mapped items)
   - Status: Future liability
   
3. **Actual Cost Level**: Invoiced amounts that have **hit the P&L**
   - Represents: **Real P&L impact** - costs recognized in financial statements
   - Source: po_line_items.invoiced_value_usd
   - Status: Actual expense in income statement

### P&L Timeline Visualization
Two critical date dimensions for P&L tracking:

1. **Invoice Date**: When costs **actually hit the P&L** (historical)
   - Shows: Past P&L impact by month/quarter
   - Used for: Actual cost reporting, variance analysis
   
2. **Supplier Promise Date**: **Expected future P&L impact date**
   - Shows: When open POs will likely hit the P&L
   - Used for: Financial forecasting, cash flow planning
   - Formula: Open PO Value = line_value - invoiced_value_usd

### Current Mock vs Required P&L-Based Implementation
- **Current (Mock)**: `invoicedAmount = actualSpend * 0.6` (arbitrary percentage)
- **Required (P&L Actual)**: `invoicedAmount = SUM(po_line_items.invoiced_value_usd WHERE invoice_date <= today)`
- **Required (Open/Future P&L)**: `openOrders = SUM(line_value - COALESCE(invoiced_value_usd, 0) WHERE invoiced_value_usd IS NULL OR invoiced_value_usd < line_value)`
- **P&L Forecast**: Group open orders by supplier_promise_date to show future P&L impact by month

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

### New KPI Metrics (P&L Focused)
1. **Total Budget**: Approved budget allocation for the project/cost lines
2. **Total Committed (PO Value)**: Sum of all mapped PO line items (future + current P&L obligations)
3. **Actual Cost (P&L Impact)**: Sum of invoiced_value_usd where invoice_date is not null
   - This represents costs that have **actually hit the P&L**
4. **Open PO Value (Future P&L Impact)**: Total PO Value - Invoiced Amount
   - This represents costs that **will hit future P&L statements**
5. **P&L Impact Timeline**: 
   - Historical: Group invoiced amounts by invoice_date month (past P&L impact)
   - Future: Group open POs by supplier_promise_date month (future P&L impact)

### New Visualizations (P&L Impact Focus)
1. **P&L Status Indicator (Three-Tier)**
   - **Budget Line**: Total approved budget (baseline)
   - **Committed Line**: Total PO value (contractual obligations)
   - **P&L Impact Line**: Invoiced amounts (actual costs in books)
   - Visual emphasis on the gap between committed and actual P&L impact

2. **P&L Impact Timeline**
   - **Historical Section**: Monthly P&L impact from invoiced amounts (solid bars)
   - **Future Section**: Expected P&L impact from supplier promise dates (striped/dotted bars)
   - **Current Month Marker**: Clear delineation between actual and projected
   - **Cumulative P&L Line**: Running total of P&L impact over time
   - Key insight: "Your P&L will increase by $X in Month Y based on promised deliveries"

3. **Future P&L Impact Calendar**
   - **Monthly Grid View**: Total expected P&L impact per month
   - **Weekly Breakdown**: For near-term (next 30 days) P&L planning
   - **Color Coding**: 
     - Green: Within budget projections
     - Yellow: Approaching budget limits
     - Red: Will exceed budget when hits P&L
   - **Drill-down**: Click month to see specific POs that will hit P&L

### Alert Enhancements (P&L Focused)
- **P&L Impact Alert**: "Invoice received - $X has hit your P&L for [Cost Line]"
- **Overdue P&L Recognition**: "Expected P&L impact of $X is overdue from [Supplier]"
- **Future P&L Warning**: "Your P&L will increase by $X next month based on promised deliveries"
- **Budget vs P&L Alert**: "Committed POs will cause P&L to exceed budget by $X when invoiced"
- **Monthly P&L Forecast**: "Expected P&L impact for [Month]: $X (Y% of remaining budget)"

## Related Research
- [`docs/research/2025-09-19_15-07-50_project_dashboard_design.md`](docs/research/2025-09-19_15-07-50_project_dashboard_design.md) - Previous dashboard design research
- [`docs/plans/2025-09-19-project-dashboard-implementation.md`](docs/plans/2025-09-19-project-dashboard-implementation.md) - Dashboard implementation plan

## Implementation Priority for P&L Tracking

### Phase 1: Core P&L Data Model
1. Add invoice tracking columns to capture P&L impact
2. Implement calculations to separate actual P&L from committed spend
3. Create P&L impact metrics in dashboard

### Phase 2: P&L Timeline Visualization
1. Historical P&L impact chart (by month/quarter)
2. Future P&L projection based on promise dates
3. Cumulative P&L tracking against budget

### Phase 3: Proactive P&L Management
1. Alerts for upcoming P&L impacts
2. P&L forecasting tools
3. Budget vs P&L variance analysis

## Business Value Statement

This enhancement transforms the system from tracking **purchase commitments** to tracking **actual P&L impact**, providing:
- **Financial Accuracy**: See actual costs that have hit the books vs future obligations
- **P&L Forecasting**: Predict when and how much will hit future P&L statements
- **Proactive Management**: Take action before costs hit the P&L, not after
- **Budget Control**: Understand true budget consumption based on P&L reality, not just PO commitments

## Open Questions
1. Should we track partial invoicing (multiple invoices per line item) for complex P&L scenarios?
2. How to handle currency conversion if invoices affect P&L in different currencies?
3. Should supplier promise dates be updateable when delays affect P&L timing?
4. Do we need approval workflows for invoice data entry to ensure P&L accuracy?
5. Should we maintain invoice history for P&L audit trails and compliance?
6. How to handle accruals for POs that span multiple P&L periods?