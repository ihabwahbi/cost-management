-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.budget_forecasts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  forecast_version_id uuid NOT NULL,
  cost_breakdown_id uuid NOT NULL,
  forecasted_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT budget_forecasts_pkey PRIMARY KEY (id),
  CONSTRAINT budget_forecasts_forecast_version_id_fkey FOREIGN KEY (forecast_version_id) REFERENCES public.forecast_versions(id),
  CONSTRAINT budget_forecasts_cost_breakdown_id_fkey FOREIGN KEY (cost_breakdown_id) REFERENCES public.cost_breakdown(id)
);
CREATE TABLE public.cost_breakdown (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  sub_business_line text NOT NULL,
  cost_line text NOT NULL,
  spend_type text NOT NULL,
  spend_sub_category text NOT NULL,
  budget_cost numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cost_breakdown_pkey PRIMARY KEY (id),
  CONSTRAINT cost_breakdown_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.forecast_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  version_number integer NOT NULL,
  reason_for_change text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  created_by text DEFAULT 'system'::text,
  CONSTRAINT forecast_versions_pkey PRIMARY KEY (id),
  CONSTRAINT forecast_versions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.po_line_items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  po_id uuid NOT NULL,
  line_item_number integer NOT NULL,
  part_number character varying NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL,
  uom character varying NOT NULL,
  line_value numeric NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  invoiced_quantity numeric,
  invoiced_value_usd numeric,
  invoice_date date,
  supplier_promise_date date,
  CONSTRAINT po_line_items_pkey PRIMARY KEY (id),
  CONSTRAINT po_line_items_po_id_fkey FOREIGN KEY (po_id) REFERENCES public.pos(id)
);
CREATE TABLE public.po_mappings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  po_line_item_id uuid NOT NULL,
  cost_breakdown_id uuid NOT NULL,
  mapped_amount numeric NOT NULL,
  mapping_notes text,
  mapped_by character varying,
  mapped_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT po_mappings_pkey PRIMARY KEY (id),
  CONSTRAINT po_mappings_po_line_item_id_fkey FOREIGN KEY (po_line_item_id) REFERENCES public.po_line_items(id),
  CONSTRAINT po_mappings_cost_breakdown_id_fkey FOREIGN KEY (cost_breakdown_id) REFERENCES public.cost_breakdown(id)
);
CREATE TABLE public.pos (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  po_number character varying NOT NULL,
  vendor_name character varying NOT NULL,
  total_value numeric NOT NULL,
  po_creation_date date NOT NULL,
  location character varying NOT NULL,
  fmt_po boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pos_pkey PRIMARY KEY (id)
);
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sub_business_line text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT projects_pkey PRIMARY KEY (id)
);