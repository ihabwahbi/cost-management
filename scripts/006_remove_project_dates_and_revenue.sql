-- Remove start_date, end_date, and revenue columns from projects table
BEGIN;

-- Remove columns from projects table
ALTER TABLE projects 
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS end_date,
DROP COLUMN IF EXISTS revenue;

COMMIT;
