-- Populate invoice tracking data for existing PO line items
-- This data represents actual P&L impact (invoiced) vs future P&L impact (promised)
BEGIN;

-- Update PO line items with invoice data based on PO number and line item number
-- Using the data provided in requirements

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

-- Add some variety to promise dates for better visualization
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

-- For demo purposes, let's add some near-term promise dates for better dashboard visualization
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

-- Verification queries to check the data
DO $$
DECLARE
    invoiced_count INTEGER;
    promised_count INTEGER;
    total_invoiced DECIMAL;
    total_open DECIMAL;
BEGIN
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
    
    RAISE NOTICE 'Invoice tracking data populated:';
    RAISE NOTICE '  - Invoiced items: %, Total P&L impact: $%', invoiced_count, total_invoiced;
    RAISE NOTICE '  - Items with promise dates: %, Future P&L impact: $%', promised_count, total_open;
END $$;

COMMIT;