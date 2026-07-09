# DCAM v11 Asset Register Foundation

## Goal

Add the first asset register foundation linked to existing customer buildings/sites.

## Backend

Added:

- assets table migration
- asset permission constants
- protected asset API routes
- asset summary endpoint
- list/search/filter assets
- create asset
- update asset
- audit records for asset create/update

## Frontend

Added:

- Assets menu item with permission visibility
- Asset Register page
- asset summary cards
- search and filters for customer, building, type and status
- create asset form
- edit asset form
- read-only asset list behavior for users without edit permission

## Permissions

Added:

- `assets:view`
- `assets:create`
- `assets:edit`

The API enforces these permissions. Frontend visibility is only a usability layer.

## Current Scope

Assets are linked to buildings, and buildings are linked to customers.

Company, customer, site, team and assigned-user scoped visibility is not simulated yet because the required user relationship tables do not exist.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v11
- ghcr.io/christianrobertson36/dcam-web:v11

The web image uses:

- VITE_API_URL=https://dcam.ctec-shop.co.uk
