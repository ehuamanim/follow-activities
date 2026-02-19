-- Initial schema for follow-activities

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  surnames VARCHAR(200),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,
  project_id INT REFERENCES projects(id) ON DELETE CASCADE,
  hours DECIMAL(5, 2) NOT NULL,
  tasks TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Seed default roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Administrator with full access'),
  ('manager', 'Project manager'),
  ('developer', 'Software developer'),
  ('designer', 'UI/UX designer')
ON CONFLICT (name) DO NOTHING;
