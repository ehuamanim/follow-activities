ALTER TABLE activities
ADD COLUMN IF NOT EXISTS cost_per_hour DECIMAL(10, 2) NOT NULL DEFAULT 0;

UPDATE activities
SET cost_per_hour = 0
WHERE cost_per_hour IS NULL;