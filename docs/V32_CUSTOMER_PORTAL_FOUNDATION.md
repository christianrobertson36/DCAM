# DCAM v32 - Customer Portal Foundation

## Scope

v32 adds the first controlled Customer Portal foundation.

## Included

- Customer portal access database table.
- Customer portal permission.
- Customer role access to the portal only.
- API route for a read-only customer dashboard.
- Customer-level backend scope enforcement.
- Fallback customer matching by login email against customer email and primary contact email.
- Audit event when the portal dashboard is viewed.
- Frontend Customer Portal menu item protected by portal permission.
- Read-only portal dashboard for linked customers, sites, assets, open work, reports and certificates.
- Fixed image tags moved to v32 for API and Web.

## Scope Logic

Customer users only see records for customers linked through:

- `customer_portal_access`
- matching login email to `customers.email`
- matching login email to `customers.primary_contact_email`

Internal users with the portal permission can view the portal dashboard and optionally filter by customer.

## Deployment

Expected images:

- `ghcr.io/christianrobertson36/dcam-api:v32`
- `ghcr.io/christianrobertson36/dcam-web:v32`

Ports remain unchanged:

- Web external: `3096`
- API external: `5056`
- API internal: `5055`
