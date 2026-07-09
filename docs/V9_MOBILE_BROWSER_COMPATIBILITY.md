# DCAM v9 Mobile Browser Compatibility

## Goal

Fix blank-page behavior on mobile browsers after public Cloudflare routing was corrected.

## Problem

The public site and API routes were reachable, but the deployed JavaScript bundle still used modern browser features that can fail on older mobile browsers.

Observed compatibility risks:

- `String.prototype.replaceAll`
- nullish coalescing output in the production bundle

## Fix

Added:

- a compatibility-safe status class helper instead of `replaceAll`
- Vite build target `es2018`

The GitHub image workflow now publishes:

- ghcr.io/christianrobertson36/dcam-api:v9
- ghcr.io/christianrobertson36/dcam-web:v9

The web image still uses:

- VITE_API_URL=https://dcam.ctec-shop.co.uk

## TrueNAS Images

Use:

- ghcr.io/christianrobertson36/dcam-api:v9
- ghcr.io/christianrobertson36/dcam-web:v9
