# DCAM v7 Permissions and Audit Foundation

## Goal

Add the first real permission enforcement layer before expanding DCAM with more modules.

## Backend

Added:

- central permission constants and role permission mapping
- live active-user check inside protected API requests
- reusable permission middleware
- customer API permission checks
- building API permission checks
- protected not-implemented responses for future module endpoints
- audit events migration
- audit records for customer create/update
- audit records for building create/update

## Frontend

Added:

- permission-aware menu visibility
- menu limited to implemented pages
- customer create/edit visibility based on permissions
- building create/edit visibility based on permissions
- read-only list behavior for roles without edit permission
- v7 interface labels

## Current Permission Scope

v7 enforces role-level permissions for the records that currently exist.

Customer-level, site-level, team-level and assigned-user scoping are intentionally not simulated yet because the required relationship tables do not exist. Those scopes must be added with real schema support in later versions.

## Deployment

Keep fixed image tags:

- ghcr.io/christianrobertson36/dcam-api:v7
- ghcr.io/christianrobertson36/dcam-web:v7

Keep ports:

- Web external: 3096
- API external: 5056
- API internal: 5055
