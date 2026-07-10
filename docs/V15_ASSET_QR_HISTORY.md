# DCAM v15 Asset QR and History Foundation

## Goal

Add the first QR label and asset timeline foundation.

## Added

- unique QR token on every asset
- protected QR lookup endpoint
- asset history database table
- asset create/update history events
- document/photo upload and delete history events
- QR code panel in the asset edit view
- asset timeline panel in the asset edit view

## Permissions

- `assets:view` can resolve QR tokens and view asset history.
- `assets:edit` actions write history events when assets or files change.

Frontend visibility is not the security boundary. The API enforces access.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v15
- ghcr.io/christianrobertson36/dcam-web:v15
