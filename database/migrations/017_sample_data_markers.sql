-- DCAM v24 Sample Data Controls

ALTER TABLE customers ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE work_orders ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE schedule_assignments ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE staff_profiles ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE staff_qualifications ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE work_order_checklist_items ADD COLUMN IF NOT EXISTS sample_data_key TEXT;
ALTER TABLE work_order_signatures ADD COLUMN IF NOT EXISTS sample_data_key TEXT;

CREATE INDEX IF NOT EXISTS idx_customers_sample_data_key ON customers (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_buildings_sample_data_key ON buildings (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_assets_sample_data_key ON assets (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_work_orders_sample_data_key ON work_orders (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_schedule_assignments_sample_data_key ON schedule_assignments (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_sample_data_key ON staff_profiles (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_staff_qualifications_sample_data_key ON staff_qualifications (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_work_order_checklist_items_sample_data_key ON work_order_checklist_items (sample_data_key);
CREATE INDEX IF NOT EXISTS idx_work_order_signatures_sample_data_key ON work_order_signatures (sample_data_key);
