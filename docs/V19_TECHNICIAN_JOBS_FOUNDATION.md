# DCAM v19 - Technician Jobs Foundation

## Added

- Protected technician jobs API for assigned work.
- My Jobs frontend page for assigned job visibility and status updates.
- Backend assigned-user scope for engineers, technicians and subcontractors.
- Manager scope for CEO, Operations Manager and Office Administrator.
- Audit events when technician job status or completion notes are updated.

## Access Control

- CEO, Operations Manager and Office Administrator can view and manage technician jobs.
- Engineer and Technician can view and update jobs assigned to themselves.
- Subcontractor can view and update jobs assigned to themselves.
- Backend scope enforcement prevents assigned users updating work that is not assigned to them.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v19`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v19`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
