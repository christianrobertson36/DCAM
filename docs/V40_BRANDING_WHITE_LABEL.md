# DCAM v40 Branding and White-Label Settings

## Goal

Provide a secure single-organisation branding foundation that can later become tenant-specific for the DCAM SaaS platform.

## Branding settings

- Product name
- Company name
- Tagline
- Primary, accent and sidebar colours
- Support email and telephone
- Company address
- Powered-by-DCAM visibility
- Main logo
- Browser favicon

## Application areas

Branding is loaded before authentication and applied to the login screen, sidebar identity, browser title, favicon, core colour variables and the settings preview. Safe DCAM defaults are used when branding is unavailable.

## Security and permissions

- Public access is read-only and limited to display-safe branding fields and assets.
- Changes require `settings:admin` and are enforced by the API.
- Changes and asset uploads/removals are written to the audit trail.
- Uploads accept validated PNG or WebP content only and are limited to 2 MB.
- Previous uploaded brand assets are removed when replaced.

## Storage

- PostgreSQL table: `branding_settings`
- Migration: `026_branding_settings.sql`
- Files: `/app/uploads/branding` inside the API container
- TrueNAS persistence continues through `/mnt/APP_POOL/dcam/uploads`

## Current limitations

- Branding is global for the current DCAM installation.
- Per-tenant branding, email templates, report headers and custom domains are future SaaS work.
- SVG is intentionally not accepted initially; PNG and WebP reduce active-content risk.
