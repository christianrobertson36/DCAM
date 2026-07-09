-- DCAM v12 Asset Register Core Fields

CREATE SEQUENCE IF NOT EXISTS asset_reference_seq START WITH 1000;

ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_reference TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS asset_category TEXT NOT NULL DEFAULT 'General';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'Unknown';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS ownership_type TEXT NOT NULL DEFAULT 'Customer Owned';
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_provider TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_reference TEXT;
ALTER TABLE assets ADD COLUMN IF NOT EXISTS warranty_expiry DATE;

UPDATE assets
SET asset_reference = 'AST-' || LPAD(id::TEXT, 6, '0')
WHERE asset_reference IS NULL;

ALTER TABLE assets ALTER COLUMN asset_reference SET NOT NULL;

SELECT setval(
  'asset_reference_seq',
  GREATEST((SELECT COALESCE(MAX(id), 0) FROM assets), 1000)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_assets_asset_reference ON assets (asset_reference);
CREATE INDEX IF NOT EXISTS idx_assets_asset_category ON assets (asset_category);
CREATE INDEX IF NOT EXISTS idx_assets_condition ON assets (condition);
CREATE INDEX IF NOT EXISTS idx_assets_ownership_type ON assets (ownership_type);
CREATE INDEX IF NOT EXISTS idx_assets_warranty_expiry ON assets (warranty_expiry);
