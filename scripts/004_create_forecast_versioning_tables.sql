-- Create forecast_versions table to track version metadata
CREATE TABLE IF NOT EXISTS public.forecast_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  reason_for_change TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system'
);

-- Create budget_forecasts table to store versioned budget data
CREATE TABLE IF NOT EXISTS public.budget_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forecast_version_id UUID NOT NULL REFERENCES public.forecast_versions(id) ON DELETE CASCADE,
  cost_breakdown_id UUID NOT NULL REFERENCES public.cost_breakdown(id) ON DELETE CASCADE,
  forecasted_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.forecast_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_forecasts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all operations for now)
CREATE POLICY "Allow all operations on forecast_versions" ON public.forecast_versions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on budget_forecasts" ON public.budget_forecasts
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forecast_versions_project_id ON public.forecast_versions(project_id);
CREATE INDEX IF NOT EXISTS idx_forecast_versions_version_number ON public.forecast_versions(project_id, version_number);
CREATE INDEX IF NOT EXISTS idx_budget_forecasts_version_id ON public.budget_forecasts(forecast_version_id);
CREATE INDEX IF NOT EXISTS idx_budget_forecasts_cost_breakdown_id ON public.budget_forecasts(cost_breakdown_id);

-- Create unique constraint to ensure one version number per project
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_project_version ON public.forecast_versions(project_id, version_number);
