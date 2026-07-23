# DCAM v44 Customer 360

## Goal

Give authorised internal users one consolidated customer view without duplicating operational records.

## Included

- customer account owner, risk and billing contact details
- summary counts for contacts, buildings, assets, work orders, requests, defects, reports, certificates and pipeline opportunities
- customer contact list
- communication and review activity timeline
- customer document upload and download
- English and Romanian interface coverage
- responsive Customer 360 workspace

## Security and permissions

- viewing requires `customers.view`
- account updates, activities and uploads require `customers.edit`
- every endpoint also requires authentication
- uploaded files are validated by type and limited to 5 MB
- important changes are sent to the existing audit service

The Customer 360 page is an internal CRM view. Customer portal users continue to use their separately scoped portal routes.

## Storage

Customer files are stored under:

`/app/uploads/customers/{customerId}`

The existing TrueNAS uploads mount keeps these files persistent.

## API

- `GET /api/customers/:id/overview`
- `PATCH /api/customers/:id/account`
- `POST /api/customers/:id/activities`
- `POST /api/customers/:id/documents`
- `GET /api/customers/:id/documents/:documentId/download`

## Current limitations

- activities cannot yet be edited or removed
- document preview and deletion are not included
- opportunity values are summarised as a count only
- portal-visible document sharing will be added through the customer portal security model
