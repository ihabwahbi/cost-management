-- Insert Shell Crux project
INSERT INTO public.projects (name, sub_business_line, start_date, end_date)
VALUES ('Shell Crux', 'WIS', '2024-01-01', '2024-12-31')
ON CONFLICT DO NOTHING;

-- Get the project ID for Shell Crux
DO $$
DECLARE
    project_uuid UUID;
BEGIN
    SELECT id INTO project_uuid FROM public.projects WHERE name = 'Shell Crux' LIMIT 1;
    
    -- Insert cost breakdown data for Shell Crux
    INSERT INTO public.cost_breakdown (project_id, sub_business_line, cost_line, spend_type, spend_sub_category, budget_cost) VALUES
    (project_uuid, 'WIS', 'M&S', 'Operational', 'Coil Strings', 490),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'Coil Drums', 370),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'Coil Monocable', 120),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'ACTive', 350),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'PCE 7in Risers', 250),
    (project_uuid, 'WIS', 'M&S', 'Maintenance', 'BOP Recert / Spares', 100),
    (project_uuid, 'WIS', 'M&S', 'Maintenance', 'Treating Iron', 100),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'IH Stand for Stabbing', 150),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'PCE X-Overs / Lifting Caps', 80),
    (project_uuid, 'WIS', 'M&S', 'Maintenance', 'Maintenance Recert', 150),
    (project_uuid, 'WIS', 'M&S', 'Operational', 'Critical Ops Spare Parts', 150)
    ON CONFLICT DO NOTHING;
END $$;
