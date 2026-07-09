-- DCAM v3 Customers Foundation

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  trading_name TEXT,
  customer_type TEXT NOT NULL DEFAULT 'Commercial',
  status TEXT NOT NULL DEFAULT 'Prospect',

  email TEXT,
  phone TEXT,
  website TEXT,

  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  county TEXT,
  postcode TEXT,
  country TEXT NOT NULL DEFAULT 'Romania',

  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,

  notes TEXT,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_company_name ON customers (company_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON customers (customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_postcode ON customers (postcode);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at);
