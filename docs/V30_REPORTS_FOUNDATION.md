# DCAM v30 - Reports Foundation

## Scope

v30 adds the first controlled Reports module.

## Included

- Report database table and reference sequence.
- API routes for listing, summary, create, view, update and export.
- Backend permissions for viewing, creating, editing, approving and exporting reports.
- Approval enforcement in the API.
- Export enforcement in the API.
- Audit events for report creation, update, approval and export.
- Frontend Reports menu item protected by report permissions.
- Reports page with summary cards, filters, create and edit workflow.
- One edit action per report row.
- Report update history panel.
- Fixed image tags moved to v30 for API and Web.

## Report Links

Reports can be linked to:

- Customer
- Building
- Asset
- Work order
- Compliance service

## Deployment

Expected images:

- `ghcr.io/christianrobertson36/dcam-api:v30`
- `ghcr.io/christianrobertson36/dcam-web:v30`

Ports remain unchanged:

- Web external: `3096`
- API external: `5056`
- API internal: `5055`
