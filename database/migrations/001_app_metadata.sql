-- DCAM v1 Initial Database Notes
-- Full production schema will be added in later sprints.
-- This file exists so the database/migrations folder is tracked.

CREATE TABLE IF NOT EXISTS app_metadata (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO app_metadata (key, value)
VALUES ('app', 'DCAM')
ON CONFLICT (key) DO NOTHING;

INSERT INTO app_metadata (key, value)
VALUES ('version', 'v1')
ON CONFLICT (key) DO NOTHING;
