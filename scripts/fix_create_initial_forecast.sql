-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS create_initial_forecast(UUID, JSONB);

-- Create atomic function for initial forecast creation with reason_for_change
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
    -- Create Version 0 forecast with reason_for_change
    INSERT INTO forecast_versions (
      project_id,
      version_number,
      reason_for_change,
      created_by,
      created_at
    )
    VALUES (
      p_project_id,
      0,
      'Initial budget creation',
      'system',
      NOW()
    )
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
        budget_cost,
        created_at,
        updated_at
      )
      VALUES (
        p_project_id,
        COALESCE((v_cost_entry->>'sub_business_line')::TEXT, ''),
        COALESCE((v_cost_entry->>'cost_line')::TEXT, ''),
        COALESCE((v_cost_entry->>'spend_type')::TEXT, ''),
        COALESCE((v_cost_entry->>'spend_sub_category')::TEXT, ''),
        COALESCE((v_cost_entry->>'budget_cost')::DECIMAL, 0),
        NOW(),
        NOW()
      )
      RETURNING id INTO v_cost_id;

      -- Create corresponding forecast record
      INSERT INTO budget_forecasts (
        forecast_version_id,
        cost_breakdown_id,
        forecasted_cost,
        created_at
      )
      VALUES (
        v_version_id,
        v_cost_id,
        COALESCE((v_cost_entry->>'budget_cost')::DECIMAL, 0),
        NOW()
      );
    END LOOP;

    -- Return success
    RETURN QUERY SELECT TRUE, v_version_id, 'Initial forecast created successfully'::TEXT;

  EXCEPTION WHEN OTHERS THEN
    -- Return error with detailed message
    RETURN QUERY SELECT FALSE, NULL::UUID, SQLERRM::TEXT;
  END;
END;
$$ LANGUAGE plpgsql;