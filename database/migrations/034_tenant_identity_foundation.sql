-- DCAM v54 Multi-company tenant identity foundation.
-- This establishes tenant ownership for identities and audit events.
-- Business-table isolation is applied in the next dedicated migration.

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  default_language TEXT NOT NULL DEFAULT 'en' CHECK (default_language IN ('en', 'ro')),
  default_currency TEXT NOT NULL DEFAULT 'GBP' CHECK (default_currency IN ('GBP', 'RON')),
  timezone TEXT NOT NULL DEFAULT 'Europe/London',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO tenants (
  id, name, slug, status, default_language, default_currency, timezone
)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'DCAM Operating Company',
  'default',
  'active',
  'en',
  'GBP',
  'Europe/London'
)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS tenant_id UUID
  REFERENCES tenants(id) ON DELETE RESTRICT;

UPDATE users
SET tenant_id = '00000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

ALTER TABLE users ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE users ALTER COLUMN tenant_id
  SET DEFAULT '00000000-0000-4000-8000-000000000001';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
DROP INDEX IF EXISTS idx_users_email;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_tenant_email
  ON users (tenant_id, LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users (tenant_id);

ALTER TABLE audit_events
  ADD COLUMN IF NOT EXISTS tenant_id UUID
  REFERENCES tenants(id) ON DELETE RESTRICT;

UPDATE audit_events ae
SET tenant_id = u.tenant_id
FROM users u
WHERE ae.actor_user_id = u.id
  AND ae.tenant_id IS NULL;

UPDATE audit_events
SET tenant_id = '00000000-0000-4000-8000-000000000001'
WHERE tenant_id IS NULL;

ALTER TABLE audit_events ALTER COLUMN tenant_id SET NOT NULL;
ALTER TABLE audit_events ALTER COLUMN tenant_id
  SET DEFAULT '00000000-0000-4000-8000-000000000001';
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_id
  ON audit_events (tenant_id);

ALTER TABLE microsoft_tenants
  ADD COLUMN IF NOT EXISTS dcam_tenant_id UUID
  REFERENCES tenants(id) ON DELETE RESTRICT;

UPDATE microsoft_tenants
SET dcam_tenant_id = '00000000-0000-4000-8000-000000000001'
WHERE dcam_tenant_id IS NULL;

ALTER TABLE microsoft_tenants ALTER COLUMN dcam_tenant_id SET NOT NULL;
ALTER TABLE microsoft_tenants ALTER COLUMN dcam_tenant_id
  SET DEFAULT '00000000-0000-4000-8000-000000000001';

