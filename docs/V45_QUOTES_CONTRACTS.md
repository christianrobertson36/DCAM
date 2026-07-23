# DCAM v45 Quotations and Contracts

## Included

- customer, building and pipeline-linked quotations
- reusable quotation line items with quantity and unit price
- automatic subtotal, tax and total calculations
- Draft, Sent, Accepted, Rejected and Expired workflow
- conversion of accepted quotations into renewable contracts
- active contract values and renewal dates
- English and Romanian interface coverage
- responsive commercial workspace

## Access control

The commercial module follows the established CRM pipeline access model:

- `pipeline.view` — view quotations and contracts
- `pipeline.create` — create quotations
- `pipeline.edit` — change quotation status and create a contract

All API routes also require authentication. Commercial actions are written to the audit trail.

## API

- `GET /api/commercial/summary`
- `GET /api/commercial/quotations`
- `GET /api/commercial/quotations/:id`
- `POST /api/commercial/quotations`
- `PATCH /api/commercial/quotations/:id/status`
- `POST /api/commercial/quotations/:id/contract`
- `GET /api/commercial/contracts`

## Current limitations

- quotation editing after creation is not included
- PDF quotation generation and customer acceptance links are future work
- contracts are created with a one-year default period from the interface
- recurring service schedules will be connected in a later contract automation checkpoint
