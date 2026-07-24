# DCAM v47 Contract Renewals and Recurring Services

## Included

- renewal date, status, notice period and account owner
- 90-day renewal and overdue renewal summaries
- operational alerts for renewals and due contracted services
- one-click renewal opportunity creation in the CRM pipeline
- recurring services linked to contracts, buildings, assets and assigned staff
- monthly, quarterly, six-monthly and annual frequencies
- controlled generation of due work orders
- duplicate work-order protection by service and due date
- automatic advancement of the next service date
- English and Romanian interface and Help Centre updates

## Workflow

1. Open **Quotes & Contracts**.
2. Select **Manage** beside a contract.
3. Set the renewal date, notice period and responsible owner.
4. Add the recurring services included in the contract.
5. Use **Generate Due Work** to create work orders for services due today or earlier.
6. Use **Start Renewal Opportunity** when renewal discussions begin.

## Permissions

- `pipeline.view` views contracts and renewal information
- `pipeline.edit` manages renewal settings
- `pipeline.create` creates renewal opportunities
- `maintenance_plans.create` adds recurring contracted services
- `work_orders.create` generates due work orders

All actions require authentication and important changes are recorded in the audit trail.

## Safety

Work orders have a unique contract-service and due-date link. Re-running generation cannot create a second work order for the same scheduled service occurrence.

## Current limitations

- due-work generation is an authorised button action rather than a background scheduler
- recurring services cannot yet be edited or paused from the interface
- renewal quotations still use the standard quotation builder
