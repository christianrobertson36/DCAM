# DCAM v20 - Technician Job Evidence Foundation

## Added

- Work order evidence table for job photos and documents.
- Protected technician job evidence API for list, upload and download.
- Evidence upload panel inside My Jobs.
- Evidence file download from assigned jobs.
- Audit event when job evidence is uploaded.

## Access Control

- CEO, Operations Manager and Office Administrator can manage job evidence.
- Engineer, Technician and Subcontractor can view and upload evidence only for jobs assigned to themselves.
- Backend assigned-job scope is enforced for evidence list, upload and download.
- Evidence uploads are stored under the existing uploads volume for TrueNAS compatibility.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v20`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v20`
- Web external port remains `3096`.
- API external port remains `5056`.
- API internal port remains `5055`.
