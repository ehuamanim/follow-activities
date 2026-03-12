-- Initial schema for follow-activities

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  surnames VARCHAR(200),
  email VARCHAR(255) UNIQUE NOT NULL,
  profile VARCHAR(20) NOT NULL DEFAULT 'Operator',
  status CHAR(1) NOT NULL DEFAULT 'A',
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS profile VARCHAR(20) NOT NULL DEFAULT 'Operator';

ALTER TABLE users
ADD COLUMN IF NOT EXISTS status CHAR(1) NOT NULL DEFAULT 'A';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_profile_check'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_profile_check CHECK (profile IN ('Operator', 'Administrator'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE users
    ADD CONSTRAINT users_status_check CHECK (status IN ('A', 'I'));
  END IF;
END $$;

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
