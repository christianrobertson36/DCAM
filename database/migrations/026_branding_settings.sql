CREATE TABLE IF NOT EXISTS branding_settings (
  id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  product_name TEXT NOT NULL DEFAULT 'DCAM',
  company_name TEXT NOT NULL DEFAULT 'Digital Compliance & Asset Management',
  tagline TEXT NOT NULL DEFAULT 'Technical compliance operations, connected.',
  primary_color TEXT NOT NULL DEFAULT '#2563EB',
  accent_color TEXT NOT NULL DEFAULT '#38BDF8',
  sidebar_color TEXT NOT NULL DEFAULT '#07111F',
  support_email TEXT,
  support_phone TEXT,
  company_address TEXT,
  logo_filename TEXT,
  logo_content_type TEXT,
  favicon_filename TEXT,
  favicon_content_type TEXT,
  show_powered_by BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO branding_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;
