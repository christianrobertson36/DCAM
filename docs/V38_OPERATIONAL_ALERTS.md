# DCAM v38 Operational Alerts

## Goal

Turn the top-bar notification placeholder into a live operational alert centre.

## Alert sources

- Overdue work orders
- Overdue and upcoming planned maintenance
- Failed compliance services and recorded defects
- Expired and expiring certificates
- Assets due for service or out of service
- Staff qualifications expired or expiring within 60 days
- Customer-scoped open work for customer portal users

## Permission and scope rules

- An alert source is requested only when the signed-in user has its view permission.
- Existing API permission middleware remains the final access-control layer.
- Customer users receive only the existing customer-scoped portal summary.
- Restricted module totals do not appear in the alert count or panel.
- Each alert links only to a page already available through the user’s permission-filtered navigation.

## Current behaviour

- Live alert count on the top-bar bell
- Severity indicators for urgent and upcoming items
- Manual refresh and last-checked time
- Partial-source error handling
- Responsive desktop and mobile panel

## Current limitations

- Alerts are derived live and are not stored as notification records.
- There is no read/unread, dismissal, email, push, or assignment workflow yet.
- Detailed notification preferences will be added with the future automation and notifications module.
