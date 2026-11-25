-- Project budgets and membership

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget_hours DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE projects
ADD COLUMN IF NOT EXISTS budget_cost DECIMAL(12, 2) NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS project_members (
  project_id INT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);
