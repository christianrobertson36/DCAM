CREATE SEQUENCE IF NOT EXISTS service_request_reference_seq START WITH 1;

CREATE TABLE IF NOT EXISTS service_requests (
  id SERIAL PRIMARY KEY,
  request_reference TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  requested_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  requester_name TEXT,
  requester_email TEXT,
  requester_phone TEXT,
  category TEXT NOT NULL DEFAULT 'Maintenance',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'New',
  source TEXT NOT NULL DEFAULT 'Portal',
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  sla_due_at TIMESTAMPTZ,
  work_order_id INTEGER REFERENCES work_orders(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  converted_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  closed_at TIMESTAMPTZ,
  closed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_request_updates (
  id SERIAL PRIMARY KEY,
  service_request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  visibility TEXT NOT NULL DEFAULT 'Customer Visible',
  message TEXT NOT NULL,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS service_request_files (
  id SERIAL PRIMARY KEY,
  service_request_id INTEGER NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'Customer Visible',
  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_service_requests_customer ON service_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_assigned ON service_requests(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_sla ON service_requests(sla_due_at);
CREATE INDEX IF NOT EXISTS idx_service_request_updates_request ON service_request_updates(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_files_request ON service_request_files(service_request_id);
