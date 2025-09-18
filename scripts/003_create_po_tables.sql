-- Create POs table
CREATE TABLE IF NOT EXISTS public.pos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_number TEXT NOT NULL UNIQUE,
    vendor_name TEXT NOT NULL,
    project_name TEXT,
    asset_code TEXT,
    fmt_status TEXT DEFAULT 'No',
    total_value NUMERIC DEFAULT 0,
    creation_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PO line items table
CREATE TABLE IF NOT EXISTS public.po_line_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_id UUID REFERENCES public.pos(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    value NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create PO mappings table to link POs to cost breakdown entries
CREATE TABLE IF NOT EXISTS public.po_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    po_id UUID REFERENCES public.pos(id) ON DELETE CASCADE,
    cost_breakdown_id UUID REFERENCES public.cost_breakdown(id) ON DELETE CASCADE,
    mapped_amount NUMERIC DEFAULT 0,
    mapping_notes TEXT,
    mapped_by TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(po_id, cost_breakdown_id)
);

-- Enable Row Level Security
ALTER TABLE public.pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.po_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on pos" ON public.pos FOR ALL USING (true);
CREATE POLICY "Allow all operations on po_line_items" ON public.po_line_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on po_mappings" ON public.po_mappings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_pos_po_number ON public.pos(po_number);
CREATE INDEX IF NOT EXISTS idx_pos_creation_date ON public.pos(creation_date);
CREATE INDEX IF NOT EXISTS idx_po_line_items_po_id ON public.po_line_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_mappings_po_id ON public.po_mappings(po_id);
CREATE INDEX IF NOT EXISTS idx_po_mappings_cost_breakdown_id ON public.po_mappings(cost_breakdown_id);
