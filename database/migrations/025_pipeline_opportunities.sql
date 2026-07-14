-- DCAM v34 CRM Pipeline Foundation

CREATE TABLE IF NOT EXISTS pipeline_opportunities (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_id INTEGER REFERENCES contacts(id) ON DELETE SET NULL,
  opportunity_reference TEXT NOT NULL UNIQUE,
  opportunity_name TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Lead',
  status TEXT NOT NULL DEFAULT 'Open',
  estimated_value NUMERIC(12, 2) NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0,
  expected_close_date DATE,
  owner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  source TEXT,
  next_action TEXT,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS opportunity_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_customer_id ON pipeline_opportunities (customer_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_contact_id ON pipeline_opportunities (contact_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_owner_user_id ON pipeline_opportunities (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_stage ON pipeline_opportunities (stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_status ON pipeline_opportunities (status);
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_expected_close_date ON pipeline_opportunities (expected_close_date);
