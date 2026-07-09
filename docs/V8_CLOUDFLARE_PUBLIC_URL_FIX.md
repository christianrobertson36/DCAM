# DCAM v8 Cloudflare Public URL Fix

## Goal

Fix public/mobile access through Cloudflare for:

- https://dcam.ctec-shop.co.uk

## Problem

The v7 web image was built with:

- http://192.168.1.177:5056

That works on the local network, but mobile/public browsers using the Cloudflare URL cannot reach a private LAN API address.

## Fix

The GitHub image publishing workflow now builds:

- ghcr.io/christianrobertson36/dcam-api:v8
- ghcr.io/christianrobertson36/dcam-web:v8

The web image is built with:

- VITE_API_URL=https://dcam.ctec-shop.co.uk

## TrueNAS Images

Use:

- ghcr.io/christianrobertson36/dcam-api:v8
- ghcr.io/christianrobertson36/dcam-web:v8

Keep ports:

- Web external: 3096
- API external: 5056
- API internal: 5055

## Nginx / Cloudflare Routing

The public domain must route both frontend and API paths:

- `/` to the web service on port 3096
- `/api/` to the API service on port 5056
- `/auth/` to the API service on port 5056
- `/health` to the API service on port 5056
