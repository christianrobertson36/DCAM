-- DCAM v31 Certificates Foundation

CREATE TABLE IF NOT EXISTS certificates (
  id SERIAL PRIMARY KEY,

  certificate_reference TEXT NOT NULL UNIQUE,
  certificate_title TEXT NOT NULL,
  certificate_type TEXT NOT NULL DEFAULT 'Compliance Certificate',
  status TEXT NOT NULL DEFAULT 'Draft',
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  compliance_service_id INTEGER REFERENCES compliance_services(id) ON DELETE SET NULL,
  report_id INTEGER REFERENCES reports(id) ON DELETE SET NULL,
  issue_date DATE,
  expiry_date DATE,
  certificate_body TEXT,
  issued_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ,
  revoked_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS certificate_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_certificates_reference ON certificates (certificate_reference);
CREATE INDEX IF NOT EXISTS idx_certificates_type ON certificates (certificate_type);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON certificates (status);
CREATE INDEX IF NOT EXISTS idx_certificates_customer_id ON certificates (customer_id);
CREATE INDEX IF NOT EXISTS idx_certificates_building_id ON certificates (building_id);
CREATE INDEX IF NOT EXISTS idx_certificates_asset_id ON certificates (asset_id);
CREATE INDEX IF NOT EXISTS idx_certificates_service_id ON certificates (compliance_service_id);
CREATE INDEX IF NOT EXISTS idx_certificates_report_id ON certificates (report_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expiry_date ON certificates (expiry_date);
