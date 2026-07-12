# DCAM v23 - Settings and Language Foundation

## Added

- Settings menu section for logged-in users.
- Language selector on the login screen and Settings page.
- Persistent frontend language preference saved on the device.
- English and Romanian language support for app menus, pages, buttons, labels and forms.
- Frontend translation layer that switches visible app text without changing backend data values.

## Access Control

- Settings page is visible to authenticated users with dashboard access.
- Language preference is local to the device and does not require a backend write.
- No protected backend action was added for language selection.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v23`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v23`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
