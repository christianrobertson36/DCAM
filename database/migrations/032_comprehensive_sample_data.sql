-- DCAM v49 Comprehensive Operating Company Sample Data

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE pipeline_opportunities ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE maintenance_plans ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE compliance_services ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE service_requests ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE defects ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE customer_activities ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE contract_services ADD COLUMN IF NOT EXISTS sample_data_key TEXT;

CREATE INDEX IF NOT EXISTS idx_contacts_sample_data_key ON contacts(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_pipeline_opportunities_sample_data_key ON pipeline_opportunities(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_sample_data_key ON maintenance_plans(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_compliance_services_sample_data_key ON compliance_services(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_form_templates_sample_data_key ON form_templates(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_reports_sample_data_key ON reports(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_certificates_sample_data_key ON certificates(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_service_requests_sample_data_key ON service_requests(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_defects_sample_data_key ON defects(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_customer_activities_sample_data_key ON customer_activities(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_quotations_sample_data_key ON quotations(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_contracts_sample_data_key ON contracts(sample_data_key);
CREATE INDEX IF NOT EXISTS idx_contract_services_sample_data_key ON contract_services(sample_data_key);
