# DCAM v22 - Technician Job Sign-Off Foundation

## Added

- Work order signature/sign-off table.
- Protected technician sign-off API for list and create.
- Job Sign-Off panel inside My Jobs.
- Signer name, role, signature text and notes capture.
- Audit event when a job sign-off is captured.

## Access Control

- CEO, Operations Manager and Office Administrator can manage job sign-offs.
- Engineer, Technician and Subcontractor can view and create sign-offs only for jobs assigned to themselves.
- Backend assigned-job scope is enforced for sign-off list and create actions.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v22`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v22`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
