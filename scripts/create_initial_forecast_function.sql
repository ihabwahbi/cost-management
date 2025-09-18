-- Create atomic function for initial forecast creation
CREATE OR REPLACE FUNCTION create_initial_forecast(
  p_project_id UUID,
  p_cost_entries JSONB
)
RETURNS TABLE(
  success BOOLEAN,
  version_id UUID,
  message TEXT
) AS $$
DECLARE
  v_version_id UUID;
  v_cost_entry JSONB;
  v_cost_id UUID;
BEGIN
  -- Start transaction
  BEGIN
    -- Added reason_for_change field to satisfy not-null constraint
    -- Create Version 0 forecast
    INSERT INTO forecast_versions (project_id, version_number, reason_for_change, created_at)
    VALUES (p_project_id, 0, 'Initial budget creation', NOW())
    RETURNING id INTO v_version_id;
    
    -- Insert each cost entry and create corresponding forecast record
    FOR v_cost_entry IN SELECT * FROM jsonb_array_elements(p_cost_entries)
    LOOP
      -- Insert cost breakdown entry
      INSERT INTO cost_breakdown (
        project_id,
        sub_business_line,
        cost_line,
        spend_type,
        spend_sub_category,
        budget_cost
      )
      VALUES (
        p_project_id,
        (v_cost_entry->>'sub_business_line')::TEXT,
        (v_cost_entry->>'cost_line')::TEXT,
        (v_cost_entry->>'spend_type')::TEXT,
        (v_cost_entry->>'spend_sub_category')::TEXT,
        (v_cost_entry->>'budget_cost')::DECIMAL
      )
      RETURNING id INTO v_cost_id;
      
      -- Create corresponding forecast record
      INSERT INTO budget_forecasts (
        forecast_version_id,
        cost_breakdown_id,
        forecasted_cost
      )
      VALUES (
        v_version_id,
        v_cost_id,
        (v_cost_entry->>'budget_cost')::DECIMAL
      );
    END LOOP;
    
    -- Return success
    RETURN QUERY SELECT TRUE, v_version_id, 'Initial forecast created successfully'::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    -- Return error
    RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;
