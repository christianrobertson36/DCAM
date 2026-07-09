-- DCAM v11 Asset Register Foundation

CREATE TABLE IF NOT EXISTS assets (
  id SERIAL PRIMARY KEY,

  building_id INTEGER NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,

  asset_name TEXT NOT NULL,
  asset_tag TEXT,
  asset_type TEXT NOT NULL DEFAULT 'General',
  status TEXT NOT NULL DEFAULT 'Active',
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  location_description TEXT,
  install_date DATE,
  last_service_date DATE,
  next_service_date DATE,
  notes TEXT,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_building_id ON assets (building_id);
CREATE INDEX IF NOT EXISTS idx_assets_asset_name ON assets (asset_name);
CREATE INDEX IF NOT EXISTS idx_assets_asset_tag ON assets (asset_tag);
CREATE INDEX IF NOT EXISTS idx_assets_asset_type ON assets (asset_type);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets (status);
CREATE INDEX IF NOT EXISTS idx_assets_serial_number ON assets (serial_number);
CREATE INDEX IF NOT EXISTS idx_assets_next_service_date ON assets (next_service_date);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON assets (created_at);
