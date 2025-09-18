-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  sub_business_line TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cost_breakdown table for hierarchical cost structure
CREATE TABLE IF NOT EXISTS public.cost_breakdown (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sub_business_line TEXT NOT NULL,
  cost_line TEXT NOT NULL,
  spend_type TEXT NOT NULL,
  spend_sub_category TEXT NOT NULL,
  budget_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_breakdown ENABLE ROW LEVEL SECURITY;

-- Create policies for projects (allow all operations for now - can be restricted later)
CREATE POLICY "Allow all operations on projects" ON public.projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on cost_breakdown" ON public.cost_breakdown
  FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cost_breakdown_project_id ON public.cost_breakdown(project_id);
CREATE INDEX IF NOT EXISTS idx_projects_sub_business_line ON public.projects(sub_business_line);
