-- DCAM v15 Asset QR and History Foundation

ALTER TABLE assets ADD COLUMN IF NOT EXISTS qr_token TEXT;

UPDATE assets
SET qr_token = LOWER(MD5(id::TEXT || asset_reference || created_at::TEXT))
WHERE qr_token IS NULL;

ALTER TABLE assets ALTER COLUMN qr_token SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_qr_token ON assets (qr_token);

CREATE TABLE IF NOT EXISTS asset_history (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_title TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_asset_history_asset_id ON asset_history (asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_history_event_type ON asset_history (event_type);
CREATE INDEX IF NOT EXISTS idx_asset_history_created_at ON asset_history (created_at);
