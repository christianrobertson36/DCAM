# DCAM v10 Mobile Startup Hardening

## Goal

Make mobile startup failures visible and prevent browser storage restrictions from causing a blank page.

## Fix

Added:

- safe local storage helpers for token read/write/remove
- React startup error boundary
- static HTML fallback inside `#root`

This means restricted/private mobile browsers should show either the app or a visible startup message instead of a blank page.

## Images

GitHub publishes:

- ghcr.io/christianrobertson36/dcam-api:v10
- ghcr.io/christianrobertson36/dcam-web:v10

The web image still uses:

- VITE_API_URL=https://dcam.ctec-shop.co.uk
