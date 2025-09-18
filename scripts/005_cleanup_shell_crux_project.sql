-- Script to remove all Shell Crux project data for fresh testing
-- Delete data in order to respect foreign key constraints

-- First, get the project ID for Shell Crux
DO $$
DECLARE
    shell_crux_project_id UUID;
BEGIN
    -- Get the Shell Crux project ID
    SELECT id INTO shell_crux_project_id 
    FROM projects 
    WHERE name = 'Shell Crux';
    
    -- Only proceed if the project exists
    IF shell_crux_project_id IS NOT NULL THEN
        -- Delete budget forecasts (references cost_breakdown)
        DELETE FROM budget_forecasts 
        WHERE cost_breakdown_id IN (
            SELECT id FROM cost_breakdown 
            WHERE project_id = shell_crux_project_id
        );
        
        -- Delete PO mappings (references cost_breakdown)
        DELETE FROM po_mappings 
        WHERE cost_breakdown_id IN (
            SELECT id FROM cost_breakdown 
            WHERE project_id = shell_crux_project_id
        );
        
        -- Delete forecast versions (references project)
        DELETE FROM forecast_versions 
        WHERE project_id = shell_crux_project_id;
        
        -- Delete cost breakdown entries (references project)
        DELETE FROM cost_breakdown 
        WHERE project_id = shell_crux_project_id;
        
        -- Finally, delete the project itself
        DELETE FROM projects 
        WHERE id = shell_crux_project_id;
        
        RAISE NOTICE 'Successfully deleted all data for Shell Crux project';
    ELSE
        RAISE NOTICE 'Shell Crux project not found - no data to delete';
    END IF;
END $$;
