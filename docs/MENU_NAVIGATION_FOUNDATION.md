# DCAM Menu Navigation Foundation

## Purpose

DCAM uses a fixed, grouped sidebar for its expanding operational modules and a sticky top bar for page context, user identity and future global actions.

This foundation is delivered as the v35 application checkpoint.

## Navigation catalogue

All primary navigation is defined in `frontend/src/navigation.js`. Each item includes:

- a stable ID
- label and path metadata
- group membership
- icon
- required permission
- optional role and module metadata
- rollout status

New modules must be added to this catalogue instead of being scattered through layout components.

## Groups

- Overview
- CRM
- Assets
- Work Management
- Compliance
- People & Portal
- Administration

Empty groups are hidden automatically when the current user lacks access to every item in that group.

## Permissions

Menu visibility continues to use the effective permissions returned for the signed-in user. The navigation configuration stores `requiredPermission`, `requiredRole`, `requiredModule` and `status` fields so future permission and module controls can be added without redesigning the menu.

Frontend visibility is a usability layer only. Existing API permission enforcement remains authoritative.

## Responsive behavior

- Desktop: fixed full-height sidebar with independently scrolling navigation.
- Tablet and mobile: off-canvas navigation drawer with backdrop and close controls.
- Top bar: sticky page title, user context, logout and reserved global search/notification controls.

## Current limitations

- DCAM still uses internal page state rather than a URL router, so the configured paths are metadata for the future routing layer.
- Global search and notifications are deliberately disabled until their services are implemented.
- Group collapse and user favorites are future enhancements.
