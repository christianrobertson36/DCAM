# DCAM v5 TrueNAS Deployment Foundation

## Images

- ghcr.io/christianrobertson36/dcam-api:v5
- ghcr.io/christianrobertson36/dcam-web:v5
- postgres:16

## TrueNAS Storage

- /mnt/APP_POOL/dcam/postgres
- /mnt/APP_POOL/dcam/uploads
- /mnt/APP_POOL/dcam/backups

## Ports

- Web: 3095
- API: 5055
- PostgreSQL: internal only

## Automatic Startup

The API container:

1. waits for PostgreSQL
2. creates the schema migration tracker
3. applies unapplied SQL migrations
4. creates the initial administrator only when missing
5. starts the API

## Initial Login

Email:

admin@dcam.local

Initial password:

ChangeMe123!

Change this before public deployment.
