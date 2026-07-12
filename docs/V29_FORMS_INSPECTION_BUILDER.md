# DCAM v29 - Forms and Inspection Builder Foundation

## Scope

v29 adds the first foundation for reusable forms and inspection templates.

## Included

- Form template database table and reference sequence.
- API routes for listing, summary, create, view and update.
- Backend permissions for viewing, creating, editing and approving templates.
- Audit events for created, updated and approved templates.
- Frontend Forms Builder menu item protected by form-template permissions.
- Forms Builder page with summary cards, filters, create and edit workflow.
- One edit action per template row.
- Update history panel for saved form templates.
- Fixed image tags moved to v29 for API and Web.

## Template Capabilities

Templates support sections and questions using structured JSON. The foundation supports answer type, mandatory questions, scoring weight and option lists for dropdown-style answers.

## Roles

View access is available to operational, sales, engineering, technician and audit roles according to the backend permission map. Create, edit and approve actions are enforced by the API and not only by frontend visibility.

## Deployment

Expected images:

- `ghcr.io/christianrobertson36/dcam-api:v29`
- `ghcr.io/christianrobertson36/dcam-web:v29`

Ports remain unchanged:

- Web external: `3096`
- API external: `5056`
- API internal: `5055`
