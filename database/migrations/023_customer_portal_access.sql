-- DCAM v32 Customer Portal Foundation

CREATE TABLE IF NOT EXISTS customer_portal_access (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'Viewer',
  status TEXT NOT NULL DEFAULT 'Active',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_customer_portal_access_user_id ON customer_portal_access (user_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_access_customer_id ON customer_portal_access (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_portal_access_status ON customer_portal_access (status);
