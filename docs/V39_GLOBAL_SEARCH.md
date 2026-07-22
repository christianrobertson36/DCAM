# DCAM v39 Global Search

## Goal

Activate the top-bar search with fast, grouped results across the modules available to the signed-in user.

## Search areas

- Customers
- Contacts
- Buildings / sites
- Assets
- Work orders
- Reports
- Certificates
- People
- Customer portal buildings, assets, work, reports and certificates

## Permission and data-scope rules

- The frontend requests a module only when the signed-in user has its view permission.
- Every request uses the module's existing protected API route, so backend permission enforcement remains authoritative.
- Customer-role searches use only the customer-scoped portal response.
- Results are grouped and limited to five records per module.
- A failed or restricted module does not expose data through another search category.

## User experience

- Search begins after two characters with a short debounce.
- Results show useful references, locations, customers and statuses.
- Arrow keys move through results, Enter opens the module, and Escape closes search.
- The selected result routes to the relevant permission-filtered DCAM page.

## Current limitations

- DCAM does not yet use URL-based record routes, so a result opens its module rather than a specific record drawer.
- Mobile global search will be introduced with the later mobile command/search experience.
- Search history and saved searches are not stored.
