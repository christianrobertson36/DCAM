-- DCAM v20 Technician Job Evidence Foundation

CREATE TABLE IF NOT EXISTS work_order_files (
  id SERIAL PRIMARY KEY,

  work_order_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,

  file_kind TEXT NOT NULL DEFAULT 'photo',
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size INTEGER NOT NULL DEFAULT 0,
  notes TEXT,

  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_work_order_files_work_order_id ON work_order_files (work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_files_file_kind ON work_order_files (file_kind);
CREATE INDEX IF NOT EXISTS idx_work_order_files_created_at ON work_order_files (created_at);
