-- DCAM v21 Technician Job Checklist Foundation

CREATE TABLE IF NOT EXISTS work_order_checklist_items (
  id SERIAL PRIMARY KEY,

  work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  item_text TEXT NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  completed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_checklist_items_work_order_id ON work_order_checklist_items (work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_checklist_items_is_completed ON work_order_checklist_items (is_completed);
