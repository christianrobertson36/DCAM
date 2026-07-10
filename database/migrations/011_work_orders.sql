-- DCAM v16 Work Orders and CMMS Foundation

CREATE SEQUENCE IF NOT EXISTS work_order_reference_seq START WITH 1000;

CREATE TABLE IF NOT EXISTS work_orders (
  id SERIAL PRIMARY KEY,

  work_order_reference TEXT NOT NULL UNIQUE,
  work_order_type TEXT NOT NULL DEFAULT 'Reactive',
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'Normal',
  status TEXT NOT NULL DEFAULT 'Open',

  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  building_id INTEGER REFERENCES buildings(id) ON DELETE SET NULL,
  asset_id INTEGER REFERENCES assets(id) ON DELETE SET NULL,
  assigned_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

  due_date DATE,
  completion_notes TEXT,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_orders_reference ON work_orders (work_order_reference);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders (work_order_type);
CREATE INDEX IF NOT EXISTS idx_work_orders_priority ON work_orders (priority);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders (status);
CREATE INDEX IF NOT EXISTS idx_work_orders_customer_id ON work_orders (customer_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_building_id ON work_orders (building_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders (asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_assigned_user_id ON work_orders (assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_due_date ON work_orders (due_date);
CREATE INDEX IF NOT EXISTS idx_work_orders_created_at ON work_orders (created_at);
