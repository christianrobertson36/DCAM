# DCAM v25 - Sample Data Hotfix

## Fixed

- Fixed the sample-data installer sign-off insert so PostgreSQL can resolve all query parameters.
- Preserved the v24 protected Settings sample-data install/delete workflow.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v25`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v25`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
