-- Add activity_date column to activities table
ALTER TABLE activities
ADD COLUMN IF NOT EXISTS activity_date DATE NOT NULL DEFAULT CURRENT_DATE;

-- Backfill existing rows from created_at
UPDATE activities SET activity_date = created_at::DATE WHERE activity_date = CURRENT_DATE AND created_at IS NOT NULL;
