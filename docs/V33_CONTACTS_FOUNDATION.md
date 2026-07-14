# DCAM v33 - Contacts Foundation

## Scope

v33 adds the first CRM Contacts foundation.

## Included

- Contact database table and reference sequence.
- API routes for listing, summary, create and update.
- Backend permissions for viewing, creating and editing contacts.
- Customer linkage enforced by the API.
- Audit events for contact creation and update.
- Frontend Contacts menu item protected by contact permissions.
- Contacts page with summary cards, filters, create and edit workflow.
- One edit action per contact row.
- Contact update history panel.
- Fixed image tags moved to v33 for API and Web.

## Contact Links

Each contact is linked to one customer record.

## Deployment

Expected images:

- `ghcr.io/christianrobertson36/dcam-api:v33`
- `ghcr.io/christianrobertson36/dcam-web:v33`

Ports remain unchanged:

- Web external: `3096`
- API external: `5056`
- API internal: `5055`
