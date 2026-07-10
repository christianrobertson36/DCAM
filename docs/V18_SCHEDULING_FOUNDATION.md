# DCAM v18 - Scheduling and Job Allocation Foundation

## Added

- Schedule assignments table for allocating work orders to users.
- Protected schedule API endpoints for list, summary, create and edit.
- Schedule permissions for menu access, page access, create and edit actions.
- Schedule page with summary cards, filters, assignment list and create/edit form.
- Audit events for schedule assignment creation and updates.

## Access Control

- Super Administrator has full schedule access.
- CEO, Operations Manager and Office Administrator can view, create and edit schedule assignments.
- Engineer can view, create and edit schedule assignments.
- Sales Manager, Technician and Auditor can view schedule assignments.
- Backend permissions enforce every protected schedule API action.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v18`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v18`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
