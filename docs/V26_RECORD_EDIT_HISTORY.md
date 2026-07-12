# DCAM v26 - Record Edit History

## Added

- Single explicit Edit button on record rows instead of opening edit by clicking the whole row.
- Protected audit history API for supported record types.
- Update History panel inside edit views for customers, buildings, assets, people, work orders, schedules and technician jobs.
- Consistent row action column and history panel styling.

## Access Control

- Edit buttons only render for users with the existing edit/update permission for that section.
- History access is protected by backend permissions for each record type.
- The API does not rely on frontend visibility for history protection.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v26`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v26`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
