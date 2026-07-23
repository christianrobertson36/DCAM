# DCAM v42 Customer Requests and Service Desk

## Purpose

The Service Desk provides one controlled path from a customer or office request
through triage, customer communication, SLA monitoring and conversion into a
work order.

## Permissions

- `service_requests:view`
- `service_requests:create`
- `service_requests:edit`
- `service_requests:assign`
- `service_requests:convert`
- `service_requests:close`

Every API endpoint is authenticated and permission protected. Menu visibility
and page actions use the effective permissions returned for the signed-in user.
The API remains the authority even when an action is hidden in the interface.

## Customer scope

Customer-role users can only access requests belonging to organisations linked
through active portal access or their matching customer contact email. The same
scope is applied to request lists, individual records, updates, files and
downloads.

Customer users:

- can create requests for linked organisations
- can edit a request only while it is `New`
- can add customer-visible updates and evidence
- cannot read or create internal notes
- cannot assign, convert or close requests

## Internal workflow

1. Capture the request with customer, site, asset and requester details.
2. Apply a priority and automatic SLA target.
3. Review, assign and communicate using public or internal updates.
4. Attach PNG, JPEG, WebP or PDF evidence up to 5 MB.
5. Approve and convert the request into a linked work order.
6. Close requests that do not require conversion or after resolution.

Priority-based default SLA targets:

- Critical: 4 hours
- High: 24 hours
- Normal: 72 hours
- Low: 120 hours

## Storage

Request evidence is stored below:

`/app/uploads/service-requests/{request-id}`

The existing TrueNAS uploads mount therefore persists this evidence without a
new host path.

## Auditability

Creation, edits, updates, file uploads, conversion and closure write to the
existing audit event system. Conversion stores the generated work order on the
request so the operation cannot be repeated accidentally.

## Deployment

- API image: `ghcr.io/christianrobertson36/dcam-api:v42`
- Web image: `ghcr.io/christianrobertson36/dcam-web:v42`
- Database migration: `027_service_requests.sql`

Existing external addresses remain unchanged.
