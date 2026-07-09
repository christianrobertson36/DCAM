# DCAM v14 Asset Option Administration

## Goal

Add protected administration for Asset Register option lists.

## Added

- asset option database table
- seeded categories, types, statuses, conditions and ownership values
- protected asset option API
- Asset Settings menu item
- Asset Settings page
- create asset options
- edit labels and sort order
- activate/deactivate options
- Asset Register selects now read active options from the API

## Permissions

- `assets:view` can read active option lists for Asset Register forms and filters.
- `assets:admin` can create and update asset options.

The Asset Settings menu is only visible to users with `assets:admin`, and the API enforces the same permission.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v14
- ghcr.io/christianrobertson36/dcam-web:v14
