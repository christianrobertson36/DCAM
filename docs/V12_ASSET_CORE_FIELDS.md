# DCAM v12 Asset Register Core Fields

## Goal

Complete the missing core asset record fields from the planned Asset Register foundation.

## Added

- asset reference numbers
- asset category
- asset condition
- ownership type
- warranty provider
- warranty reference
- warranty expiry
- category and condition filtering
- duplicate asset reference protection

## Permissions

The existing asset permissions remain in force:

- `assets:view`
- `assets:create`
- `assets:edit`

The API enforces create and edit access. Frontend controls remain a usability layer only.

## Current Scope

Documents and photos are intentionally not included in v12. They need a separate protected upload, storage and audit workflow.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v12
- ghcr.io/christianrobertson36/dcam-web:v12
