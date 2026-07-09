# DCAM v3 CRM Customers Foundation

## Goal

Add the first real business data module: customer company records.

## Backend

Added:

- customers table migration
- protected customer API routes
- customer summary endpoint
- list/search/filter customers
- create customer
- update customer
- audit fields for created_by and updated_by

## Frontend

Added:

- Customers page
- customer summary cards
- customer search
- customer status filter
- create customer form
- edit customer form
- customer list connected to API

## API Routes

Protected by JWT:

- GET /api/customers
- GET /api/customers/summary
- GET /api/customers/:id
- POST /api/customers
- PATCH /api/customers/:id

## First Useful Test Customer

Company name: Acme Facilities SRL  
Customer type: Facilities Management  
Status: Active  
City: Bucharest  
Country: Romania
