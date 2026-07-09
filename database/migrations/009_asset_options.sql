-- DCAM v14 Asset Option Administration

CREATE TABLE IF NOT EXISTS asset_options (
  id SERIAL PRIMARY KEY,
  option_type TEXT NOT NULL,
  label TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT asset_options_type_label_unique UNIQUE (option_type, label)
);

CREATE INDEX IF NOT EXISTS idx_asset_options_option_type ON asset_options (option_type);
CREATE INDEX IF NOT EXISTS idx_asset_options_is_active ON asset_options (is_active);
CREATE INDEX IF NOT EXISTS idx_asset_options_sort_order ON asset_options (sort_order);

INSERT INTO asset_options (option_type, label, sort_order)
VALUES
  ('category', 'General', 10),
  ('category', 'Compliance', 20),
  ('category', 'Plant', 30),
  ('category', 'Safety', 40),
  ('category', 'Security', 50),
  ('category', 'Fabric', 60),
  ('category', 'IT', 70),
  ('category', 'Other', 80),
  ('type', 'General', 10),
  ('type', 'Fire Safety', 20),
  ('type', 'Electrical', 30),
  ('type', 'Mechanical', 40),
  ('type', 'HVAC', 50),
  ('type', 'Security', 60),
  ('type', 'Water Hygiene', 70),
  ('type', 'Other', 80),
  ('status', 'Active', 10),
  ('status', 'Service Due', 20),
  ('status', 'Out of Service', 30),
  ('status', 'Retired', 40),
  ('condition', 'Unknown', 10),
  ('condition', 'Good', 20),
  ('condition', 'Fair', 30),
  ('condition', 'Poor', 40),
  ('condition', 'Critical', 50),
  ('ownership', 'Customer Owned', 10),
  ('ownership', 'Company Owned', 20),
  ('ownership', 'Leased', 30),
  ('ownership', 'Managed Only', 40),
  ('ownership', 'Unknown', 50)
ON CONFLICT (option_type, label) DO NOTHING;
