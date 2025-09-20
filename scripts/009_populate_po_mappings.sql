-- Populate PO mappings to connect PO line items to cost breakdown
-- This script maps PO line items to the Shell Crux Project cost breakdown

-- First, let's check what we have
DO $$
DECLARE
    v_project_id UUID;
    v_po_count INTEGER;
    v_cb_count INTEGER;
    v_line_count INTEGER;
BEGIN
    -- Get the Shell Crux Project ID
    SELECT id INTO v_project_id FROM projects WHERE name = 'Shell Crux Project';
    
    -- Count cost breakdown items
    SELECT COUNT(*) INTO v_cb_count FROM cost_breakdown WHERE project_id = v_project_id;
    
    -- Count POs and line items
    SELECT COUNT(*) INTO v_po_count FROM pos;
    SELECT COUNT(*) INTO v_line_count FROM po_line_items;
    
    RAISE NOTICE 'Project ID: %', v_project_id;
    RAISE NOTICE 'Cost Breakdown Items: %', v_cb_count;
    RAISE NOTICE 'POs: %', v_po_count;
    RAISE NOTICE 'PO Line Items: %', v_line_count;
END $$;

-- Create PO mappings
-- We'll map PO line items to cost breakdown items based on matching categories
INSERT INTO po_mappings (po_line_item_id, cost_breakdown_id, mapped_amount, mapping_notes)
WITH line_items_with_categories AS (
    -- Categorize line items based on their descriptions
    SELECT 
        pli.id as line_item_id,
        pli.line_value,
        p.vendor_name,
        pli.description,
        CASE 
            -- Engineering items
            WHEN pli.description ILIKE '%valve%' OR pli.description ILIKE '%actuator%' 
                OR pli.description ILIKE '%control%' OR pli.description ILIKE '%engineering%' 
                THEN 'Engineering'
            -- Equipment items  
            WHEN pli.description ILIKE '%compressor%' OR pli.description ILIKE '%pump%' 
                OR pli.description ILIKE '%heater%' OR pli.description ILIKE '%vessel%'
                OR pli.description ILIKE '%equipment%'
                THEN 'Equipment'
            -- Material items
            WHEN pli.description ILIKE '%pipe%' OR pli.description ILIKE '%fitting%' 
                OR pli.description ILIKE '%insulation%' OR pli.description ILIKE '%material%'
                OR pli.description ILIKE '%steel%'
                THEN 'Materials'
            -- Installation items
            WHEN pli.description ILIKE '%installation%' OR pli.description ILIKE '%service%' 
                OR pli.description ILIKE '%commissioning%' OR pli.description ILIKE '%labor%'
                THEN 'Installation'
            -- Default to Equipment
            ELSE 'Equipment'
        END as spend_type,
        CASE
            -- Determine cost line based on vendor/description
            WHEN p.vendor_name ILIKE '%cameron%' OR pli.description ILIKE '%subsea%' THEN 'SPS'
            WHEN p.vendor_name ILIKE '%fmc%' OR pli.description ILIKE '%umbilical%' THEN 'URF'
            WHEN p.vendor_name ILIKE '%aker%' OR pli.description ILIKE '%surf%' THEN 'SURF'
            ELSE 'SPS' -- Default to SPS
        END as cost_line
    FROM po_line_items pli
    JOIN pos p ON pli.po_id = p.id
),
cost_breakdown_targets AS (
    -- Get cost breakdown items for the Shell Crux Project
    SELECT 
        cb.id,
        cb.cost_line,
        cb.spend_type,
        cb.budget_cost,
        cb.project_id,
        -- Calculate how much budget is already allocated
        COALESCE(SUM(pm.mapped_amount), 0) as already_mapped,
        cb.budget_cost - COALESCE(SUM(pm.mapped_amount), 0) as available_budget
    FROM cost_breakdown cb
    LEFT JOIN po_mappings pm ON pm.cost_breakdown_id = cb.id
    WHERE cb.project_id = (SELECT id FROM projects WHERE name = 'Shell Crux Project')
    GROUP BY cb.id, cb.cost_line, cb.spend_type, cb.budget_cost, cb.project_id
    HAVING cb.budget_cost - COALESCE(SUM(pm.mapped_amount), 0) > 0 -- Only items with available budget
)
-- Map line items to cost breakdown
SELECT 
    lic.line_item_id,
    cbt.id as cost_breakdown_id,
    -- Map the full line value but don't exceed available budget
    LEAST(lic.line_value, cbt.available_budget) as mapped_amount,
    'Auto-mapped based on spend type and cost line' as mapping_notes
FROM line_items_with_categories lic
JOIN cost_breakdown_targets cbt ON 
    cbt.cost_line = lic.cost_line 
    AND cbt.spend_type = lic.spend_type
WHERE NOT EXISTS (
    -- Don't create duplicate mappings
    SELECT 1 FROM po_mappings pm 
    WHERE pm.po_line_item_id = lic.line_item_id 
    AND pm.cost_breakdown_id = cbt.id
)
ORDER BY lic.line_value DESC -- Map larger items first
LIMIT 50; -- Limit to prevent over-mapping

-- Update mapped_by and timestamps
UPDATE po_mappings 
SET 
    mapped_by = 'System Auto-Mapping',
    mapped_at = NOW(),
    updated_at = NOW()
WHERE mapped_by IS NULL;

-- Show results
SELECT 
    COUNT(*) as mappings_created,
    SUM(mapped_amount) as total_mapped,
    COUNT(DISTINCT po_line_item_id) as unique_line_items,
    COUNT(DISTINCT cost_breakdown_id) as unique_cost_items
FROM po_mappings;

-- Show sample mappings
SELECT 
    p.po_number,
    pli.description,
    cb.cost_line,
    cb.spend_type,
    pm.mapped_amount,
    pli.invoiced_value_usd,
    pli.invoice_date
FROM po_mappings pm
JOIN po_line_items pli ON pm.po_line_item_id = pli.id
JOIN pos p ON pli.po_id = p.id
JOIN cost_breakdown cb ON pm.cost_breakdown_id = cb.id
LIMIT 10;