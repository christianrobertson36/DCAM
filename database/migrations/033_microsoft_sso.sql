-- DCAM v52 Microsoft Entra ID SSO Foundation

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS auth_provider TEXT NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS microsoft_tenant_id UUID,
  ADD COLUMN IF NOT EXISTS microsoft_object_id UUID,
  ADD COLUMN IF NOT EXISTS microsoft_linked_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_microsoft_identity
  ON users(microsoft_tenant_id, microsoft_object_id)
  WHERE microsoft_tenant_id IS NOT NULL AND microsoft_object_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS microsoft_tenants (
  tenant_id UUID PRIMARY KEY,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_microsoft_tenants_status ON microsoft_tenants(status);
