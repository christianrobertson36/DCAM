CREATE SEQUENCE IF NOT EXISTS defect_reference_seq START WITH 1;

CREATE TABLE IF NOT EXISTS defects (
  id SERIAL PRIMARY KEY,
  defect_reference TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  severity TEXT NOT NULL DEFAULT 'Medium',
  risk_rating TEXT NOT NULL DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'Open',
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  compliance_service_id INTEGER REFERENCES compliance_services(id) ON DELETE SET NULL,
  service_request_id INTEGER REFERENCES service_requests(id) ON DELETE SET NULL,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  identified_date DATE NOT NULL DEFAULT CURRENT_DATE,
  target_date DATE,
  corrective_action TEXT,
  verification_notes TEXT,
  verified_at TIMESTAMPTZ,
  verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS defect_files (
  id SERIAL PRIMARY KEY,
  defect_id INTEGER NOT NULL REFERENCES defects(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'Customer Visible',
  evidence_stage TEXT NOT NULL DEFAULT 'Identification',
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_defects_customer ON defects(customer_id);
CREATE INDEX IF NOT EXISTS idx_defects_building ON defects(building_id);
CREATE INDEX IF NOT EXISTS idx_defects_asset ON defects(asset_id);
CREATE INDEX IF NOT EXISTS idx_defects_service ON defects(compliance_service_id);
CREATE INDEX IF NOT EXISTS idx_defects_status ON defects(status);
CREATE INDEX IF NOT EXISTS idx_defects_severity ON defects(severity);
CREATE INDEX IF NOT EXISTS idx_defects_assigned ON defects(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_defects_target ON defects(target_date);
CREATE INDEX IF NOT EXISTS idx_defect_files_defect ON defect_files(defect_id);
