-- Drop existing PO tables and recreate with new structure
DROP TABLE IF EXISTS po_mappings;
DROP TABLE IF EXISTS po_line_items;
DROP TABLE IF EXISTS pos;

-- Create new POs table with updated structure
CREATE TABLE pos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number VARCHAR(50) NOT NULL,
  vendor_name VARCHAR(255) NOT NULL,
  total_value DECIMAL(15,2) NOT NULL,
  po_creation_date DATE NOT NULL,
  location VARCHAR(100) NOT NULL,
  fmt_po BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PO line items table
CREATE TABLE po_line_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_id UUID NOT NULL REFERENCES pos(id) ON DELETE CASCADE,
  line_item_number INTEGER NOT NULL,
  part_number VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  uom VARCHAR(20) NOT NULL,
  line_value DECIMAL(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PO mappings table (updated to reference line items)
CREATE TABLE po_mappings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  po_line_item_id UUID NOT NULL REFERENCES po_line_items(id) ON DELETE CASCADE,
  cost_breakdown_id UUID NOT NULL REFERENCES cost_breakdown(id) ON DELETE CASCADE,
  mapped_amount DECIMAL(15,2) NOT NULL,
  mapping_notes TEXT,
  mapped_by VARCHAR(255),
  mapped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(po_line_item_id, cost_breakdown_id)
);

-- Create indexes for better performance
CREATE INDEX idx_pos_po_number ON pos(po_number);
CREATE INDEX idx_pos_creation_date ON pos(po_creation_date);
CREATE INDEX idx_pos_location ON pos(location);
CREATE INDEX idx_po_line_items_po_id ON po_line_items(po_id);
CREATE INDEX idx_po_mappings_line_item ON po_mappings(po_line_item_id);
CREATE INDEX idx_po_mappings_cost_breakdown ON po_mappings(cost_breakdown_id);
