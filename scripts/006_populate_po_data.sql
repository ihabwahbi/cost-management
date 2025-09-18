-- Populate POs and line items with provided data
INSERT INTO pos (po_number, vendor_name, total_value, po_creation_date, location, fmt_po) VALUES
('4584165035', 'SPOOLTECH, LLC.', 340536.18, '2025-06-05', 'Jandakot', false),
('4584387743', 'Houston Hub', 189062.5, '2025-08-27', 'Jandakot', false),
('4584412814', 'Houston Hub', 166602.5, '2025-09-05', 'Jandakot', false);

-- Get PO IDs for line items
WITH po_ids AS (
  SELECT id, po_number FROM pos WHERE po_number IN ('4584165035', '4584387743', '4584412814')
)
INSERT INTO po_line_items (po_id, line_item_number, part_number, description, quantity, uom, line_value)
SELECT 
  po_ids.id,
  line_data.line_item_number,
  line_data.part_number,
  line_data.description,
  line_data.quantity,
  line_data.uom,
  line_data.line_value
FROM po_ids
CROSS JOIN (
  -- PO 4584165035 line items
  SELECT '4584165035' as po_num, 1 as line_item_number, '105935866' as part_number, '180" x 112" x 96" OD SPL PCK' as description, 2.00 as quantity, 'EA' as uom, 340536.18 as line_value
  UNION ALL
  -- PO 4584387743 line items
  SELECT '4584387743', 13, '103625685', 'KIT, EXPORT,1502 UNION - MALE - 2.875 IN', 1.00, 'EA', 2334.5
  UNION ALL
  SELECT '4584387743', 11, '103463958', 'TUBING, COIL, CONT, DURACOIL 130, 2.375', 700.00, 'FT', 8113.0
  UNION ALL
  SELECT '4584387743', 10, '103451661', 'TUBING, CONT, DURACOIL 130, 2.375 IN, .1', 800.00, 'FT', 7400.0
  UNION ALL
  SELECT '4584387743', 8, '103451662', 'TUBING, CONT, DURACOIL 130, 2.375 IN, .1', 800.00, 'FT', 6816.0
  UNION ALL
  SELECT '4584387743', 7, '103451663', 'TUBING, CONT, DURACOIL 130, 2.375 IN, .1', 1000.00, 'FT', 7760.0
  UNION ALL
  SELECT '4584387743', 9, '103451665', 'TUBING, MONO, DURACOIL 130, 2.375 IN, .1', 1000.00, 'FT', 8830.0
  UNION ALL
  SELECT '4584387743', 6, '103451667', 'TUBING, MONO, DURACOIL 130, 2.375 IN, .1', 7450.00, 'FT', 54832.0
  UNION ALL
  SELECT '4584387743', 12, '103103801', 'TUBING, STRAIGHT WALL, 130, 2.375 IN, 0~', 6300.00, 'FT', 73017.0
  UNION ALL
  -- PO 4584412814 line items
  SELECT '4584412814', 13, '103625685', 'KIT, EXPORT,1502 UNION - MALE - 2.875 IN', 1.00, 'EA', 2300.0
  UNION ALL
  SELECT '4584412814', 12, '103463958', 'TUBING, COIL, CONT, DURACOIL 130, 2.375', 700.00, 'FT', 7994.0
  UNION ALL
  SELECT '4584412814', 9, '103451663', 'TUBING, CONT, DURACOIL 130, 2.375 IN, .1', 1000.00, 'FT', 7650.0
  UNION ALL
  SELECT '4584412814', 8, '103451662', 'TUBING, CONT, DURACOIL 130, 2.375 IN, .1', 800.00, 'FT', 6712.0
  UNION ALL
  SELECT '4584412814', 7, '103451661', 'TUBING, CONT, DURACOIL 130, 2.375 IN, .1', 800.00, 'FT', 7288.0
  UNION ALL
  SELECT '4584412814', 11, '103451667', 'TUBING, MONO, DURACOIL 130, 2.375 IN, .1', 7450.00, 'FT', 54012.5
  UNION ALL
  SELECT '4584412814', 10, '103451665', 'TUBING, MONO, DURACOIL 130, 2.375 IN, .1', 1000.00, 'FT', 8700.0
  UNION ALL
  SELECT '4584412814', 6, '103103801', 'TUBING, STRAIGHT WALL, 130, 2.375 IN, 0~', 6300.00, 'FT', 71946.0
) line_data
WHERE po_ids.po_number = line_data.po_num;
