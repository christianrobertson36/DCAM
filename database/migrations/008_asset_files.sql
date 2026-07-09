-- DCAM v13 Asset Documents and Photos

CREATE TABLE IF NOT EXISTS asset_files (
  id SERIAL PRIMARY KEY,

  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,

  file_kind TEXT NOT NULL DEFAULT 'document',
  original_filename TEXT NOT NULL,
  stored_filename TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  file_size INTEGER NOT NULL DEFAULT 0,
  notes TEXT,

  uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_files_asset_id ON asset_files (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_files_file_kind ON asset_files (file_kind);
CREATE INDEX IF NOT EXISTS idx_asset_files_created_at ON asset_files (created_at);
