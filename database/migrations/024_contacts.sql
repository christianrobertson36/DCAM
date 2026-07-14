-- DCAM v33 Contacts Foundation

CREATE TABLE IF NOT EXISTS contacts (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  contact_reference TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  contact_type TEXT NOT NULL DEFAULT 'Primary',
  status TEXT NOT NULL DEFAULT 'Active',
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE SEQUENCE IF NOT EXISTS contact_reference_seq START WITH 1000;

CREATE INDEX IF NOT EXISTS idx_contacts_customer_id ON contacts (customer_id);
CREATE INDEX IF NOT EXISTS idx_contacts_reference ON contacts (contact_reference);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts (email);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON contacts (status);
