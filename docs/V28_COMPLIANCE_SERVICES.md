# DCAM v28 - Compliance Service Modules Foundation

## Added

- Compliance Services menu section.
- Protected compliance service API.
- Compliance service records for PAT testing, fire door inspections, fire damper testing, electrical compliance, technical audits and general building maintenance.
- Service status, result, risk rating, defects, corrective actions, report status and certificate status tracking.
- Customer, building, asset, work order and assigned-user links.
- Search, filtering, summary cards, add/edit workflow and update history.
- Audit events for service create, update and approval.

## Access Control

- Menu visibility requires `compliance_services:view`.
- Creating services requires `compliance_services:create`.
- Editing services requires `compliance_services:edit`.
- Report approval requires `compliance_services:approve` and is enforced by the API.
- Compliance service history is protected by the view permission.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v28`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v28`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
