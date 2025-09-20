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