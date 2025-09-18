-- Insert sample POs
INSERT INTO public.pos (po_number, vendor_name, project_name, asset_code, fmt_status, total_value, creation_date) VALUES
('4584391746', 'Schlumberger Technology Corp', 'Shell Crux Development', 'CRX-001', 'Yes', 2450000, '2024-01-15'),
('4584391747', 'Baker Hughes', 'Shell Crux Development', 'CRX-002', 'No', 1850000, '2024-01-20'),
('4584391748', 'Halliburton', 'Shell Crux Development', 'CRX-003', 'Yes', 3200000, '2024-01-25'),
('4584391749', 'Weatherford', 'Shell Crux Development', 'CRX-004', 'No', 950000, '2024-02-01'),
('4584391750', 'NOV Inc', 'Shell Crux Development', 'CRX-005', 'Yes', 1750000, '2024-02-05');

-- Insert sample line items for the first PO
INSERT INTO public.po_line_items (po_id, description, quantity, value) 
SELECT id, 'Coil Tubing Services', 1, 1200000 FROM public.pos WHERE po_number = '4584391746'
UNION ALL
SELECT id, 'Wireline Operations', 2, 1250000 FROM public.pos WHERE po_number = '4584391746';

-- Insert sample line items for the second PO
INSERT INTO public.po_line_items (po_id, description, quantity, value) 
SELECT id, 'Drilling Equipment', 1, 1850000 FROM public.pos WHERE po_number = '4584391747';

-- Insert sample line items for the third PO
INSERT INTO public.po_line_items (po_id, description, quantity, value) 
SELECT id, 'Cementing Services', 1, 1600000 FROM public.pos WHERE po_number = '4584391748'
UNION ALL
SELECT id, 'Completion Tools', 3, 1600000 FROM public.pos WHERE po_number = '4584391748';

-- Insert sample line items for the fourth PO
INSERT INTO public.po_line_items (po_id, description, quantity, value) 
SELECT id, 'Artificial Lift Systems', 2, 950000 FROM public.pos WHERE po_number = '4584391749';

-- Insert sample line items for the fifth PO
INSERT INTO public.po_line_items (po_id, description, quantity, value) 
SELECT id, 'Drilling Motors', 1, 875000 FROM public.pos WHERE po_number = '4584391750'
UNION ALL
SELECT id, 'Mud Pumps', 2, 875000 FROM public.pos WHERE po_number = '4584391750';
