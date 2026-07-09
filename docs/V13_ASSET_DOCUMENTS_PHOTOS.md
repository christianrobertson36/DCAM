# DCAM v13 Asset Documents and Photos

## Goal

Add the protected documents and photos foundation for Asset Register records.

## Added

- asset file database records
- protected asset file list endpoint
- protected asset file upload endpoint
- protected asset file download endpoint
- protected asset file delete endpoint
- asset edit panel for documents and photos
- upload notes
- audit records for upload and delete actions

## Permissions

- `assets:view` can list and download asset files.
- `assets:edit` can upload and delete asset files.

Frontend controls are not the security boundary. The API enforces access.

## Storage

Files are stored under:

- `/app/uploads/assets/{asset_id}` in the API container

The existing TrueNAS upload volume keeps this compatible with:

- `/mnt/APP_POOL/dcam/uploads:/app/uploads`

## Limits

Each uploaded file is limited to 5MB in this foundation checkpoint.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v13
- ghcr.io/christianrobertson36/dcam-web:v13
