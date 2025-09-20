# Invoice Tracking Database Migration Instructions

## 🚨 IMPORTANT: Database Migration Required

The implementation requires database schema updates that haven't been applied yet. Follow these steps to complete the setup:

## Step 1: Add Invoice Tracking Columns

### Method A: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Navigate to **SQL Editor** in the left sidebar
3. Create a new query and paste the content from `scripts/007_add_invoice_tracking_columns.sql`
4. Click **Run** to execute

### Method B: Direct Connection

If you have direct database access:
```bash
psql $DATABASE_URL -f scripts/007_add_invoice_tracking_columns.sql
```

### SQL Script Content:
```sql
-- Add P&L tracking columns to po_line_items table
-- These columns enable tracking of actual costs hitting the P&L vs committed PO amounts
BEGIN;

-- Add columns for tracking P&L impact
ALTER TABLE public.po_line_items
ADD COLUMN IF NOT EXISTS invoiced_quantity DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS invoiced_value_usd DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS invoice_date DATE,
ADD COLUMN IF NOT EXISTS supplier_promise_date DATE;

-- Create indexes for performance on commonly queried columns
CREATE INDEX IF NOT EXISTS idx_po_line_items_invoice_date 
ON public.po_line_items(invoice_date) 
WHERE invoice_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_po_line_items_supplier_promise_date 
ON public.po_line_items(supplier_promise_date) 
WHERE supplier_promise_date IS NOT NULL;

-- Composite index for P&L timeline queries
CREATE INDEX IF NOT EXISTS idx_po_line_items_pl_timeline
ON public.po_line_items(invoice_date, invoiced_value_usd)
WHERE invoice_date IS NOT NULL;

-- Index for finding open POs (not yet invoiced)
CREATE INDEX IF NOT EXISTS idx_po_line_items_open_pos
ON public.po_line_items(supplier_promise_date, line_value)
WHERE invoice_date IS NULL AND supplier_promise_date IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.po_line_items.invoiced_quantity IS 'Quantity that has been invoiced and hit the P&L';
COMMENT ON COLUMN public.po_line_items.invoiced_value_usd IS 'Dollar amount that has been recognized in the P&L statement';
COMMENT ON COLUMN public.po_line_items.invoice_date IS 'Date when the cost was recognized in the P&L (not PO date)';
COMMENT ON COLUMN public.po_line_items.supplier_promise_date IS 'Expected date when uninvoiced amount will hit the P&L';

-- Add check constraint to ensure data integrity
ALTER TABLE public.po_line_items 
ADD CONSTRAINT check_invoiced_value CHECK (
    invoiced_value_usd IS NULL OR invoiced_value_usd <= line_value
);

ALTER TABLE public.po_line_items
ADD CONSTRAINT check_invoiced_quantity CHECK (
    invoiced_quantity IS NULL OR invoiced_quantity <= quantity
);

COMMIT;
```

## Step 2: Populate Invoice Data

After adding the columns, run the second script to populate sample invoice data:

1. In Supabase Dashboard SQL Editor
2. Create a new query and paste the content from `scripts/008_populate_invoice_data.sql`
3. Click **Run** to execute

### Or with direct connection:
```bash
psql $DATABASE_URL -f scripts/008_populate_invoice_data.sql
```

## Step 3: Verify the Migration

### Check if columns were added:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'po_line_items' 
  AND column_name IN ('invoiced_quantity', 'invoiced_value_usd', 'invoice_date', 'supplier_promise_date');
```

### Check data population:
```sql
-- Count invoiced items
SELECT COUNT(*) as invoiced_count, 
       SUM(invoiced_value_usd) as total_pl_impact
FROM po_line_items 
WHERE invoice_date IS NOT NULL;

-- Count items with promise dates
SELECT COUNT(*) as promise_count,
       SUM(line_value - COALESCE(invoiced_value_usd, 0)) as future_pl_impact
FROM po_line_items 
WHERE supplier_promise_date IS NOT NULL 
  AND invoice_date IS NULL;

-- Check specific POs
SELECT p.po_number, 
       COUNT(li.id) as line_count,
       SUM(li.invoiced_value_usd) as invoiced_total,
       MIN(li.invoice_date) as first_invoice,
       MAX(li.supplier_promise_date) as last_promise
FROM pos p
JOIN po_line_items li ON li.po_id = p.id
WHERE p.po_number IN ('4584165035', '4584387743', '4584412814')
GROUP BY p.po_number;
```

## Step 4: Test the Dashboard

After running both migrations:

1. Navigate to your application
2. Go to Projects page
3. Click Dashboard for any project
4. You should now see:
   - Real P&L impact data (not mocked 60%)
   - Supplier promise dates in the calendar
   - Accurate invoice amounts in the P&L Command Center

## Troubleshooting

### If columns already exist:
The scripts use `IF NOT EXISTS` clauses, so they're safe to run multiple times.

### If data doesn't appear:
1. Check that the PO numbers in the script match your database
2. Verify the pos and po_line_items tables have data
3. Check browser console for any API errors

### Connection Issues:
- Ensure your `.env.local` file has correct Supabase credentials
- Check that the database is accessible from your environment

## Expected Results

After successful migration, you should have:
- ✅ 4 new columns in po_line_items table
- ✅ 4 new indexes for performance
- ✅ 2 check constraints for data integrity
- ✅ ~10 invoiced line items with P&L impact dates
- ✅ ~8 items with supplier promise dates
- ✅ Total P&L impact of ~$509,638.18

## Dashboard Features Now Available

With the migration complete, the dashboard will show:

1. **P&L Command Center** - Triple-layer view of Budget → Committed → P&L Impact
2. **Financial Control Matrix** - Category breakdown with P&L tracking
3. **P&L Timeline** - Historical and projected P&L impacts
4. **Supplier Promise Calendar** - Visual calendar of expected deliveries
5. **Real-time Metrics** - Accurate invoiced amounts vs commitments

## Support

If you encounter issues:
1. Check the Supabase logs in the Dashboard
2. Verify table permissions in Authentication settings
3. Ensure Row Level Security (RLS) policies allow the operations

The system is designed to gracefully handle missing data, so partial migrations are safe.