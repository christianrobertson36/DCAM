ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS renewal_status TEXT NOT NULL DEFAULT 'Not Started',
  ADD COLUMN IF NOT EXISTS renewal_owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS renewal_opportunity_id INTEGER REFERENCES pipeline_opportunities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS renewal_notice_days INTEGER NOT NULL DEFAULT 90;

CREATE TABLE IF NOT EXISTS contract_services (
  id SERIAL PRIMARY KEY,
  contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'Annual',
  priority TEXT NOT NULL DEFAULT 'Normal',
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  next_due_date DATE NOT NULL,
  last_generated_date DATE,
  estimated_duration_minutes INTEGER,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'Active',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS contract_service_id INTEGER REFERENCES contract_services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS generated_for_date DATE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_work_orders_contract_service_due
  ON work_orders(contract_service_id, generated_for_date)
  WHERE contract_service_id IS NOT NULL AND generated_for_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contract_services_contract ON contract_services(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_services_due ON contract_services(next_due_date);
CREATE INDEX IF NOT EXISTS idx_contract_services_status ON contract_services(status);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_status ON contracts(renewal_status);
CREATE INDEX IF NOT EXISTS idx_contracts_renewal_owner ON contracts(renewal_owner_id);
