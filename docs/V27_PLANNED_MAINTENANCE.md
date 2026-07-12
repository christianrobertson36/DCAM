# DCAM v27 - Planned Preventive Maintenance Foundation

## Added

- Maintenance Plans menu section.
- Protected maintenance plan API.
- Maintenance plan records with reference, type, status, frequency, priority, customer, building, asset, assigned user and due dates.
- Search, filtering and summary cards for planned maintenance.
- Add/edit maintenance plan workflow.
- Update History panel for maintenance plans.
- Audit events for maintenance plan creation and updates.

## Access Control

- Menu visibility requires `maintenance_plans:view`.
- Creating plans requires `maintenance_plans:create`.
- Editing plans requires `maintenance_plans:edit`.
- Backend permission enforcement protects every maintenance plan action.
- Maintenance plan history is protected by the same view permission.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v27`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v27`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
