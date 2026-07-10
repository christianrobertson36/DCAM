# DCAM v21 - Technician Job Checklist Foundation

## Added

- Work order checklist table for technician job tasks.
- Protected technician checklist API for list, create and update.
- Checklist panel inside My Jobs.
- Checklist completion tracking with completed user and timestamp.
- Audit events when checklist items are created or updated.

## Access Control

- CEO, Operations Manager and Office Administrator can manage job checklists.
- Engineer, Technician and Subcontractor can view and update checklist items only for jobs assigned to themselves.
- Backend assigned-job scope is enforced for checklist list, create and update actions.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v21`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v21`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
