# DCAM v4 Buildings / Sites Foundation

## Goal

Add buildings/sites linked to customer records.

## Backend

Added:

- buildings table migration
- protected building API routes
- customer/building relationship
- building summary endpoint
- list/search/filter buildings
- create building
- update building
- audit fields for created_by and updated_by

## Frontend

Added:

- Buildings page
- building summary cards
- building search
- customer filter
- building status filter
- create building form
- edit building form
- building list connected to API

## API Routes

Protected by JWT:

- GET /api/buildings
- GET /api/buildings/summary
- GET /api/buildings/:id
- POST /api/buildings
- PATCH /api/buildings/:id

## Why this matters

Buildings/sites are the parent level for assets, QR codes, work orders, compliance visits and certificates.
