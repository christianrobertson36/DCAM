# DCAM v31 - Certificates Foundation

## Scope

v31 adds the first controlled Certificates module.

## Included

- Certificate database table and reference sequence.
- API routes for listing, summary, create, view, update and export.
- Backend permissions for viewing, creating, editing, issuing, revoking and exporting certificates.
- Issue and revoke enforcement in the API.
- Export enforcement in the API.
- Audit events for certificate creation, update, issue, revoke and export.
- Frontend Certificates menu item protected by certificate permissions.
- Certificates page with summary cards, filters, create and edit workflow.
- One edit action per certificate row.
- Certificate update history panel.
- Fixed image tags moved to v31 for API and Web.

## Certificate Links

Certificates can be linked to:

- Customer
- Building
- Asset
- Compliance service
- Report

## Deployment

Expected images:

- `ghcr.io/christianrobertson36/dcam-api:v31`
- `ghcr.io/christianrobertson36/dcam-web:v31`

Ports remain unchanged:

- Web external: `3096`
- API external: `5056`
- API internal: `5055`
