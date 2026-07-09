-- DCAM v4 Buildings / Sites Foundation

CREATE TABLE IF NOT EXISTS buildings (
  id SERIAL PRIMARY KEY,

  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  building_type TEXT NOT NULL DEFAULT 'Commercial',
  status TEXT NOT NULL DEFAULT 'Active',

  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'Romania',

  access_notes TEXT,
  compliance_notes TEXT,
  site_contact_name TEXT,
  site_contact_email TEXT,
  site_contact_phone TEXT,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buildings_customer_id ON buildings (customer_id);
CREATE INDEX IF NOT EXISTS idx_buildings_name ON buildings (name);
CREATE INDEX IF NOT EXISTS idx_buildings_status ON buildings (status);
CREATE INDEX IF NOT EXISTS idx_buildings_building_type ON buildings (building_type);
CREATE INDEX IF NOT EXISTS idx_buildings_postcode ON buildings (postcode);
CREATE INDEX IF NOT EXISTS idx_buildings_created_at ON buildings (created_at);
