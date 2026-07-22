# DCAM v41 Branded Reports and Certificates

## Goal

Replace developer-oriented JSON downloads with customer-ready branded PDF documents.

## PDF branding

PDF exports use the global branding configuration for:

- Product and company names
- Primary and accent colours
- PNG logo
- Company address
- Support email and telephone
- Powered-by-DCAM footer preference

If branding or a logo is unavailable, exports use safe DCAM defaults. WebP remains supported in the application interface, but a PNG logo is recommended for PDF exports.

## Report PDFs

Reports include controlled metadata, customer/site/asset/work-order/service links, reporting period, approval details, executive summary, findings and recommendations.

## Certificate PDFs

Certificates include a branded certificate frame, reference, status, customer/site/asset/service links, issue and expiry dates, issuer details, certification statement and revocation reason where applicable.

## Permissions and auditing

- Report PDF export requires `reports:export`.
- Certificate PDF export requires `certificates:export`.
- Every export continues to write an audit event with document reference, status and format.
- Existing JSON export remains available by adding `?format=json` to the export endpoint.

## Files

- Default frontend downloads now use `.pdf` filenames.
- PDFs are generated in memory and are not left behind on application storage.
