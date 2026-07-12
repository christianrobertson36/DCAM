-- DCAM v30 Reports Foundation

CREATE TABLE IF NOT EXISTS reports (
  id SERIAL PRIMARY KEY,

  report_reference TEXT NOT NULL UNIQUE,
  report_title TEXT NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'Compliance Summary',
  status TEXT NOT NULL DEFAULT 'Draft',
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  compliance_service_id INTEGER REFERENCES compliance_services(id) ON DELETE SET NULL,
  date_from DATE,
  date_to DATE,
  summary TEXT,
  findings TEXT,
  recommendations TEXT,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS report_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_reports_reference ON reports (report_reference);
CREATE INDEX IF NOT EXISTS idx_reports_type ON reports (report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_customer_id ON reports (customer_id);
CREATE INDEX IF NOT EXISTS idx_reports_building_id ON reports (building_id);
CREATE INDEX IF NOT EXISTS idx_reports_asset_id ON reports (asset_id);
CREATE INDEX IF NOT EXISTS idx_reports_compliance_service_id ON reports (compliance_service_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at);
