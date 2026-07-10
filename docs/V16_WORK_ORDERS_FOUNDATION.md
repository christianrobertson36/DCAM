# DCAM v16 Work Orders and CMMS Foundation

## Goal

Add the first protected Work Orders and CMMS foundation.

## Added

- work order database records
- work order reference numbers
- reactive/planned/inspection/repair work order types
- priority and status
- customer, building and asset links
- assigned user field
- due date
- completion notes
- protected work order API
- work order summary endpoint
- Work Orders menu item and page
- create and edit work order form
- audit records for create and update

## Permissions

- `work_orders:view`
- `work_orders:create`
- `work_orders:edit`
- `work_orders:assign`

The frontend hides unavailable actions, and the API enforces permissions.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v16
- ghcr.io/christianrobertson36/dcam-web:v16
