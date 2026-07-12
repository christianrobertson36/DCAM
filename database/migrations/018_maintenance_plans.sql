-- DCAM v27 Planned Preventive Maintenance Foundation

CREATE TABLE IF NOT EXISTS maintenance_plans (
  id SERIAL PRIMARY KEY,

  plan_reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'Planned Maintenance',
  status TEXT NOT NULL DEFAULT 'Active',
  frequency TEXT NOT NULL DEFAULT 'Monthly',
  priority TEXT NOT NULL DEFAULT 'Normal',

  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  start_date DATE,
  next_due_date DATE,
  last_generated_date DATE,
  estimated_duration_minutes INTEGER,
  instructions TEXT,
  notes TEXT,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS maintenance_plan_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_reference ON maintenance_plans (plan_reference);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_status ON maintenance_plans (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_frequency ON maintenance_plans (frequency);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_customer_id ON maintenance_plans (customer_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_building_id ON maintenance_plans (building_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_asset_id ON maintenance_plans (asset_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_assigned_user_id ON maintenance_plans (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_next_due_date ON maintenance_plans (next_due_date);
