# DCAM v37 Live Operations Dashboard

## Goal

Replace the static dashboard placeholders with a live, permission-aware operational overview.

## Permission behaviour

- The dashboard requests only summary endpoints the signed-in user may view.
- Existing API permission middleware remains the final enforcement layer.
- Restricted modules are not requested and do not appear on the dashboard.
- Customer-only users receive the existing customer-scoped portal summary rather than company-wide totals.
- A failed module does not prevent permitted data from other modules being displayed.

## Live dashboard areas

- Work orders and overdue work
- Asset register and service condition
- Compliance service outcomes and defects
- Planned maintenance deadlines
- Reports and certificates
- Customers, buildings and CRM pipeline
- Customer-scoped estate and document totals

## User experience

- Live data indicator
- Manual refresh action
- Last refreshed time
- Partial-load warning when an individual summary is unavailable
- Responsive operational cards for desktop, tablet and mobile

## Future development

New modules should expose a protected summary endpoint and add their dashboard request behind the matching view permission. Record-level scope must be enforced by the API before dashboard data is returned.
