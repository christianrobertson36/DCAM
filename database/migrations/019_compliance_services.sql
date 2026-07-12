-- DCAM v28 Compliance Service Modules Foundation

CREATE TABLE IF NOT EXISTS compliance_services (
  id SERIAL PRIMARY KEY,

  service_reference TEXT NOT NULL UNIQUE,
  service_name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'Technical Compliance Audit',
  status TEXT NOT NULL DEFAULT 'Planned',
  priority TEXT NOT NULL DEFAULT 'Normal',
  result_status TEXT NOT NULL DEFAULT 'Not Started',
  risk_rating TEXT NOT NULL DEFAULT 'Unrated',

  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  scheduled_date DATE,
  completed_date DATE,
  defects_found BOOLEAN NOT NULL DEFAULT FALSE,
  certificate_required BOOLEAN NOT NULL DEFAULT TRUE,
  certificate_status TEXT NOT NULL DEFAULT 'Not Required',
  report_status TEXT NOT NULL DEFAULT 'Draft',
  findings TEXT,
  corrective_actions TEXT,
  notes TEXT,

  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS compliance_service_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_compliance_services_reference ON compliance_services (service_reference);
CREATE INDEX IF NOT EXISTS idx_compliance_services_type ON compliance_services (service_type);
CREATE INDEX IF NOT EXISTS idx_compliance_services_status ON compliance_services (status);
CREATE INDEX IF NOT EXISTS idx_compliance_services_result_status ON compliance_services (result_status);
CREATE INDEX IF NOT EXISTS idx_compliance_services_risk_rating ON compliance_services (risk_rating);
CREATE INDEX IF NOT EXISTS idx_compliance_services_customer_id ON compliance_services (customer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_services_building_id ON compliance_services (building_id);
CREATE INDEX IF NOT EXISTS idx_compliance_services_asset_id ON compliance_services (asset_id);
CREATE INDEX IF NOT EXISTS idx_compliance_services_work_order_id ON compliance_services (work_order_id);
CREATE INDEX IF NOT EXISTS idx_compliance_services_assigned_user_id ON compliance_services (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_compliance_services_scheduled_date ON compliance_services (scheduled_date);
