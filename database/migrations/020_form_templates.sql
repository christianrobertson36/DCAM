-- DCAM v29 Forms and Inspection Builder Foundation

CREATE TABLE IF NOT EXISTS form_templates (
  id SERIAL PRIMARY KEY,

  template_reference TEXT NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  service_type TEXT NOT NULL DEFAULT 'Technical Compliance Audit',
  status TEXT NOT NULL DEFAULT 'Draft',
  version_number INTEGER NOT NULL DEFAULT 1,
  scoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  approval_required BOOLEAN NOT NULL DEFAULT TRUE,
  description TEXT,
  sections JSONB NOT NULL DEFAULT '[]'::JSONB,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS form_template_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_form_templates_reference ON form_templates (template_reference);
CREATE INDEX IF NOT EXISTS idx_form_templates_service_type ON form_templates (service_type);
CREATE INDEX IF NOT EXISTS idx_form_templates_status ON form_templates (status);
CREATE INDEX IF NOT EXISTS idx_form_templates_created_at ON form_templates (created_at);
