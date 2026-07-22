# DCAM v36 User Access Administration

## Scope

This checkpoint adds permission-protected administration for DCAM user accounts and a read-only view of every role's effective permissions.

## Permissions

- `users:view` — view and search user accounts and their account audit history.
- `users:manage` — create users, update identity/role/status and reset passwords.
- `roles:view` — inspect the role permission matrix.

Super Administrators receive all three permissions. CEO, Operations Manager and Office Administrator receive read-only user and role access. Existing permissions remain unchanged.

## API

All routes require authentication and their corresponding permission:

- `GET /api/admin/users`
- `GET /api/admin/users/roles`
- `GET /api/admin/users/:id/audit`
- `POST /api/admin/users`
- `PATCH /api/admin/users/:id`
- `POST /api/admin/users/:id/reset-password`

The API prevents self-deactivation and prevents removal of the final active Super Administrator. Password hashes are never returned.

## Interface

The permission-aware Administration menu now includes **Users & Access**. The page provides:

- account totals and status summaries
- search, role and status filters
- create and edit forms
- role assignment
- activation and deactivation
- temporary password creation/reset
- effective permission counts
- role permission matrix
- account-specific audit history

## Audit events

The following events are written to the existing audit log:

- `user.created`
- `user.updated`
- `user.password_reset`

Passwords and password hashes are never included in audit metadata.

## Current limitation

Password reset sets a temporary password selected by an administrator. Forced password change on next login and self-service recovery should be added in a future authentication-hardening checkpoint.
