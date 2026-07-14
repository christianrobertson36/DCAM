# DCAM v34 - CRM Pipeline Foundation

## Scope

v34 adds the first CRM Pipeline foundation.

## Included

- Pipeline opportunity database table and reference sequence.
- API routes for listing, summary, create and update.
- Backend permissions for viewing, creating and editing pipeline opportunities.
- Customer and contact linkage enforced by the API.
- Audit events for opportunity creation and update.
- Frontend Pipeline menu item protected by pipeline permissions.
- Pipeline page with summary cards, filters, create and edit workflow.
- One edit action per opportunity row.
- Opportunity update history panel.
- Fixed image tags moved to v34 for API and Web.

## Opportunity Links

Each opportunity can be linked to:

- Customer
- Contact
- Owner user

## Deployment

Expected images:

- `ghcr.io/christianrobertson36/dcam-api:v34`
- `ghcr.io/christianrobertson36/dcam-web:v34`

Ports remain unchanged:

- Web external: `3096`
- API external: `5056`
- API internal: `5055`
