# DCAM v54 SaaS Tenant Identity Foundation

## Outcome

DCAM now has an immutable company-account identity that is carried through user authentication, JWT sessions, user administration and audit events.

## Included

- `tenants` company-account table with UUID identity.
- Backward-compatible default tenant for all existing data and users.
- Every user belongs to exactly one tenant.
- Email uniqueness is enforced inside each tenant rather than globally.
- Authenticated sessions contain and validate the tenant UUID.
- Suspended tenants cannot authenticate.
- User listing, creation, editing, password resets and super-admin safeguards are limited to the signed-in tenant.
- Audit events carry tenant identity.
- Microsoft Entra organisations can map to a DCAM tenant.
- Settings includes company name, account reference, language, currency and timezone.
- The active company is visible in the top bar.

## Important security status

This is the identity foundation, not the final business-data isolation checkpoint.

Customers, buildings, assets, work orders and all related business tables still require explicit tenant ownership, backfill, indexes and enforced row-level isolation. DCAM must not onboard unrelated paying companies into one database until that next checkpoint is complete and tested.

## Next checkpoint

Add tenant ownership to every business table and enforce it in PostgreSQL plus every API query, including negative cross-tenant tests.
