# DCAM v24 - Sample Data Controls

## Added

- Settings sample-data panel for Super Administrator users.
- Protected API endpoints to inspect, install and delete sample data.
- Demo records across customers, buildings, assets, work orders, schedule, technician jobs, checklists, sign-offs and People where safe.
- Sample data marker migration so delete actions remove only records created by the sample-data installer.
- Audit events for sample-data install and delete actions.

## Access Control

- Language settings remain available to authenticated users with dashboard access.
- Sample-data install and delete actions require `settings:admin`.
- The API enforces the permission on every sample-data action.
- Delete requires a frontend confirmation toggle and still only deletes records marked with the sample-data key.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v24`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v24`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
