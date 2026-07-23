# DCAM v43 Defects and Corrective Actions

## Purpose

The Defect Register controls findings from identification through corrective
work, independent verification and closure.

## Workflow

1. Record the defect against a customer, building, asset and optional
   compliance service.
2. Set category, severity, risk rating, owner and target date.
3. Record the required corrective action.
4. Create a linked corrective work order where required.
5. Upload identification, remediation and verification evidence.
6. Move completed remediation to `Awaiting Verification`.
7. An authorised user records mandatory verification notes.
8. Only a verified defect can be closed.

## Permissions

- `defects:view`
- `defects:create`
- `defects:edit`
- `defects:assign`
- `defects:verify`
- `defects:close`

Customer users receive read-only access to defects within their linked customer
scope. They can only see evidence marked `Customer Visible`. The API enforces
scope and permissions independently of the interface.

## Evidence

PNG, JPEG, WebP and PDF files up to 5 MB can be classified as:

- Identification
- Remediation
- Verification

Evidence is stored under `/app/uploads/defects/{defect-id}` and therefore uses
the existing persistent TrueNAS uploads mount.

## Operational integration

Defects are included in:

- permission-controlled navigation
- global search
- operational alerts for critical and overdue defects
- internal and customer dashboards
- the existing audit-event system

Creating corrective work generates and links one work order. Duplicate
conversion is blocked.

## English and Romanian

The new page, menu entry, controls, statuses, evidence stages and primary user
messages have English and Romanian labels. Service Desk option labels were also
updated to use language-aware display labels while preserving stable API values.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v43`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v43`
- Migration: `028_defects.sql`
