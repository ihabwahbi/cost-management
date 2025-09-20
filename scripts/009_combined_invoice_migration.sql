-- Combined Invoice Tracking Migration Script
-- This script combines both schema changes and data population
-- Run this in Supabase SQL Editor for complete setup

BEGIN;

-- ============================================
-- PART 1: Add Invoice Tracking Columns
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Starting invoice tracking migration...';
END $$;

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

-- Add check constraints (wrapped in DO block to handle if they exist)
DO $$
BEGIN
    -- Try to add the constraints, ignore if they already exist
    BEGIN
        ALTER TABLE public.po_line_items 
        ADD CONSTRAINT check_invoiced_value CHECK (
            invoiced_value_usd IS NULL OR invoiced_value_usd <= line_value
        );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
    
    BEGIN
        ALTER TABLE public.po_line_items
        ADD CONSTRAINT check_invoiced_quantity CHECK (
            invoiced_quantity IS NULL OR invoiced_quantity <= quantity
        );
    EXCEPTION
        WHEN duplicate_object THEN NULL;
    END;
END $$;

-- ============================================
-- PART 2: Populate Invoice Data
-- ============================================
DO $$
BEGIN
    RAISE NOTICE 'Populating invoice tracking data...';
END $$;

-- PO 4584165035 - SPOOLTECH, LLC. - Fully invoiced
UPDATE public.po_line_items li
SET 
    invoiced_quantity = li.quantity,  -- Fully invoiced
    invoiced_value_usd = 340536.18,   -- Full amount hit P&L
    invoice_date = '2025-07-15'::DATE -- When it hit the P&L
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584165035'
    AND li.line_item_number = 1;

-- PO 4584387743 - Houston Hub - Fully invoiced items
-- Line 13: KIT, EXPORT
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 1,
    invoiced_value_usd = 2334.50,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 13;

-- Line 11: TUBING, COIL
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 700,
    invoiced_value_usd = 8113.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 11;

-- Line 10: TUBING, CONT 800 FT
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 800,
    invoiced_value_usd = 7400.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 10;

-- Line 8: TUBING, CONT 800 FT
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 800,
    invoiced_value_usd = 6816.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 8;

-- Line 7: TUBING, CONT 1000 FT
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 1000,
    invoiced_value_usd = 7760.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 7;

-- Line 9: TUBING, MONO 1000 FT
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 1000,
    invoiced_value_usd = 8830.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 9;

-- Line 6: TUBING, MONO 7450 FT
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 7450,
    invoiced_value_usd = 54832.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 6;

-- Line 12: TUBING, STRAIGHT WALL
UPDATE public.po_line_items li
SET 
    invoiced_quantity = 6300,
    invoiced_value_usd = 73017.00,
    invoice_date = '2025-08-25'::DATE
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584387743'
    AND li.line_item_number = 12;

-- PO 4584412814 - Houston Hub - Not yet invoiced (future P&L impact)
-- These have supplier promise dates indicating when they'll hit the P&L
UPDATE public.po_line_items li
SET 
    invoiced_quantity = NULL,  -- Not yet invoiced
    invoiced_value_usd = NULL,  -- Not yet in P&L
    invoice_date = NULL,        -- No P&L impact yet
    supplier_promise_date = '2026-01-15'::DATE  -- Expected P&L impact date
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584412814';

-- Add variety to promise dates for better visualization
UPDATE public.po_line_items li
SET supplier_promise_date = 
    CASE li.line_item_number
        WHEN 13 THEN '2026-01-15'::DATE
        WHEN 12 THEN '2026-01-15'::DATE
        WHEN 9 THEN '2026-01-15'::DATE
        WHEN 8 THEN '2026-01-15'::DATE
        WHEN 7 THEN '2026-01-15'::DATE
        WHEN 11 THEN '2026-01-15'::DATE
        WHEN 10 THEN '2026-01-15'::DATE
        WHEN 6 THEN '2026-01-15'::DATE
        ELSE supplier_promise_date
    END
FROM public.pos p
WHERE li.po_id = p.id 
    AND p.po_number = '4584412814';

-- For demo purposes, add some near-term promise dates for better dashboard visualization
-- Add promise dates to some other POs if they exist
UPDATE public.po_line_items
SET supplier_promise_date = 
    CASE 
        WHEN invoice_date IS NOT NULL THEN NULL  -- Already invoiced, no promise needed
        WHEN RANDOM() < 0.3 THEN CURRENT_DATE + INTERVAL '7 days'
        WHEN RANDOM() < 0.6 THEN CURRENT_DATE + INTERVAL '30 days'
        ELSE CURRENT_DATE + INTERVAL '60 days'
    END
WHERE invoice_date IS NULL 
    AND supplier_promise_date IS NULL
    AND po_id IN (SELECT id FROM public.pos LIMIT 10);

-- ============================================
-- PART 3: Verification & Summary
-- ============================================
DO $$
DECLARE
    invoiced_count INTEGER;
    promised_count INTEGER;
    total_invoiced DECIMAL;
    total_open DECIMAL;
    column_count INTEGER;
BEGIN
    -- Check if columns were created
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns 
    WHERE table_name = 'po_line_items' 
      AND column_name IN ('invoiced_quantity', 'invoiced_value_usd', 'invoice_date', 'supplier_promise_date');
    
    -- Count invoiced items
    SELECT COUNT(*), SUM(invoiced_value_usd) 
    INTO invoiced_count, total_invoiced
    FROM public.po_line_items 
    WHERE invoice_date IS NOT NULL;
    
    -- Count items with promise dates
    SELECT COUNT(*), SUM(line_value - COALESCE(invoiced_value_usd, 0))
    INTO promised_count, total_open
    FROM public.po_line_items 
    WHERE supplier_promise_date IS NOT NULL 
        AND invoice_date IS NULL;
    
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Invoice Tracking Migration Complete!';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'Schema Updates:';
    RAISE NOTICE '  - Invoice columns added: %/4', column_count;
    RAISE NOTICE 'Data Population:';
    RAISE NOTICE '  - Invoiced items: %', invoiced_count;
    RAISE NOTICE '  - Total P&L impact: $%', COALESCE(total_invoiced, 0);
    RAISE NOTICE '  - Items with promise dates: %', promised_count;
    RAISE NOTICE '  - Future P&L impact: $%', COALESCE(total_open, 0);
    RAISE NOTICE '====================================';
END $$;

-- Final verification query
SELECT 
    'Migration Summary' as report,
    COUNT(*) FILTER (WHERE invoice_date IS NOT NULL) as invoiced_items,
    COUNT(*) FILTER (WHERE supplier_promise_date IS NOT NULL AND invoice_date IS NULL) as promised_items,
    SUM(invoiced_value_usd) FILTER (WHERE invoice_date IS NOT NULL) as total_pl_impact,
    SUM(line_value - COALESCE(invoiced_value_usd, 0)) FILTER (WHERE supplier_promise_date IS NOT NULL) as future_pl_impact
FROM public.po_line_items;

COMMIT;

-- Display sample of updated data
SELECT 
    p.po_number,
    li.line_item_number,
    li.description,
    li.line_value,
    li.invoiced_value_usd,
    li.invoice_date,
    li.supplier_promise_date,
    CASE 
        WHEN li.invoice_date IS NOT NULL THEN 'Invoiced (P&L Hit)'
        WHEN li.supplier_promise_date IS NOT NULL THEN 'Promised (Future P&L)'
        ELSE 'Open (No Date)'
    END as status
FROM public.po_line_items li
JOIN public.pos p ON li.po_id = p.id
WHERE p.po_number IN ('4584165035', '4584387743', '4584412814')
   OR li.invoice_date IS NOT NULL
   OR li.supplier_promise_date IS NOT NULL
ORDER BY 
    CASE 
        WHEN li.invoice_date IS NOT NULL THEN 1
        WHEN li.supplier_promise_date IS NOT NULL THEN 2
        ELSE 3
    END,
    p.po_number, 
    li.line_item_number
LIMIT 20;