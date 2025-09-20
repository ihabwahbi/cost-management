-- Debug query for P&L tracking data
-- Run this in Supabase SQL Editor to verify invoice data

-- ============================================
-- 1. CHECK INVOICE COLUMNS EXIST
-- ============================================
SELECT 
    'Column Check' as check_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'po_line_items'
AND column_name IN ('invoiced_quantity', 'invoiced_value_usd', 'invoice_date', 'supplier_promise_date')
ORDER BY column_name;

-- ============================================
-- 2. INVOICE DATA SUMMARY
-- ============================================
SELECT 
    'Overall Summary' as report_type,
    COUNT(*) as total_line_items,
    COUNT(*) FILTER (WHERE invoice_date IS NOT NULL) as invoiced_items,
    COUNT(*) FILTER (WHERE supplier_promise_date IS NOT NULL AND invoice_date IS NULL) as promised_items,
    COUNT(*) FILTER (WHERE invoice_date IS NULL AND supplier_promise_date IS NULL) as no_dates,
    COALESCE(SUM(invoiced_value_usd) FILTER (WHERE invoice_date IS NOT NULL), 0) as total_invoiced,
    COALESCE(SUM(line_value - COALESCE(invoiced_value_usd, 0)) FILTER (WHERE supplier_promise_date IS NOT NULL), 0) as future_pl_impact
FROM po_line_items;

-- ============================================
-- 3. CHECK SPECIFIC POS (should have invoice data)
-- ============================================
SELECT 
    'Specific POs' as report_type,
    p.po_number,
    p.vendor_name,
    COUNT(li.id) as line_count,
    COUNT(li.invoice_date) as invoiced_lines,
    SUM(li.line_value) as total_po_value,
    SUM(li.invoiced_value_usd) as total_invoiced,
    MIN(li.invoice_date) as first_invoice_date,
    MAX(li.supplier_promise_date) as last_promise_date
FROM pos p
JOIN po_line_items li ON li.po_id = p.id
WHERE p.po_number IN ('4584165035', '4584387743', '4584412814')
GROUP BY p.po_number, p.vendor_name
ORDER BY p.po_number;

-- ============================================
-- 4. SAMPLE LINE ITEMS WITH INVOICE DATA
-- ============================================
SELECT 
    'Sample Line Items' as report_type,
    p.po_number,
    li.line_item_number,
    LEFT(li.description, 30) as description_preview,
    li.line_value,
    li.invoiced_value_usd,
    li.invoice_date,
    li.supplier_promise_date,
    CASE 
        WHEN li.invoice_date IS NOT NULL THEN 'Invoiced (P&L Hit)'
        WHEN li.supplier_promise_date IS NOT NULL THEN 'Promised (Future P&L)'
        ELSE 'No Date'
    END as status
FROM po_line_items li
JOIN pos p ON li.po_id = p.id
WHERE li.invoice_date IS NOT NULL 
   OR li.supplier_promise_date IS NOT NULL
ORDER BY 
    li.invoice_date DESC NULLS LAST,
    li.supplier_promise_date
LIMIT 20;

-- ============================================
-- 5. PROJECT DATA FLOW CHECK
-- ============================================
WITH project_summary AS (
    SELECT 
        pr.id,
        pr.name,
        COUNT(DISTINCT cb.id) as cost_breakdown_count,
        COUNT(DISTINCT pm.id) as mapping_count,
        SUM(cb.budget_cost) as total_budget
    FROM projects pr
    LEFT JOIN cost_breakdown cb ON cb.project_id = pr.id
    LEFT JOIN po_mappings pm ON pm.cost_breakdown_id = cb.id
    GROUP BY pr.id, pr.name
    ORDER BY mapping_count DESC
    LIMIT 5
)
SELECT 
    'Project Flow' as report_type,
    ps.name as project_name,
    ps.cost_breakdown_count,
    ps.mapping_count,
    ps.total_budget,
    COUNT(DISTINCT li.id) as mapped_line_items,
    COUNT(DISTINCT CASE WHEN li.invoice_date IS NOT NULL THEN li.id END) as invoiced_items,
    COALESCE(SUM(pm.mapped_amount), 0) as total_committed,
    COALESCE(SUM(
        CASE WHEN li.invoice_date IS NOT NULL AND li.line_value > 0
        THEN pm.mapped_amount * (li.invoiced_value_usd / li.line_value)
        ELSE 0 END
    ), 0) as total_pl_impact
FROM project_summary ps
LEFT JOIN cost_breakdown cb ON cb.project_id = ps.id
LEFT JOIN po_mappings pm ON pm.cost_breakdown_id = cb.id
LEFT JOIN po_line_items li ON li.id = pm.po_line_item_id
GROUP BY ps.name, ps.cost_breakdown_count, ps.mapping_count, ps.total_budget
ORDER BY ps.mapping_count DESC;

-- ============================================
-- 6. MONTHLY P&L TIMELINE
-- ============================================
SELECT 
    'Monthly P&L' as report_type,
    TO_CHAR(invoice_date, 'YYYY-MM') as month,
    COUNT(*) as invoice_count,
    SUM(invoiced_value_usd) as monthly_pl_impact
FROM po_line_items
WHERE invoice_date IS NOT NULL
GROUP BY TO_CHAR(invoice_date, 'YYYY-MM')
ORDER BY month;

-- ============================================
-- 7. FUTURE P&L BY PROMISE DATE
-- ============================================
SELECT 
    'Future P&L' as report_type,
    TO_CHAR(supplier_promise_date, 'YYYY-MM') as month,
    COUNT(*) as item_count,
    SUM(line_value - COALESCE(invoiced_value_usd, 0)) as future_pl_impact
FROM po_line_items
WHERE supplier_promise_date IS NOT NULL 
  AND invoice_date IS NULL
GROUP BY TO_CHAR(supplier_promise_date, 'YYYY-MM')
ORDER BY month;

-- ============================================
-- 8. DATA INTEGRITY CHECK
-- ============================================
SELECT 
    'Data Integrity' as check_type,
    'Line items with invoice > line value' as issue,
    COUNT(*) as count
FROM po_line_items
WHERE invoiced_value_usd > line_value
UNION ALL
SELECT 
    'Data Integrity' as check_type,
    'Line items with invoice date but no value' as issue,
    COUNT(*) as count
FROM po_line_items
WHERE invoice_date IS NOT NULL AND invoiced_value_usd IS NULL
UNION ALL
SELECT 
    'Data Integrity' as check_type,
    'Line items with promise date in the past' as issue,
    COUNT(*) as count
FROM po_line_items
WHERE supplier_promise_date < CURRENT_DATE AND invoice_date IS NULL;