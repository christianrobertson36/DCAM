# DCAM v7 GitHub and TrueNAS Update Path

## Purpose

GitHub builds and publishes fixed DCAM container images to GHCR.

TrueNAS deploys DCAM by pulling those fixed GHCR image tags.

Do not use `latest`.

## Current v7 Images

- ghcr.io/christianrobertson36/dcam-api:v7
- ghcr.io/christianrobertson36/dcam-web:v7

## GitHub Publishing

The workflow is:

- `.github/workflows/build-dcam-images.yml`

It publishes:

- API image tag: `v7`
- Web image tag: `v7`

It runs on:

- push to `master`
- manual workflow dispatch

The workflow needs:

- `packages: write`
- GitHub `GITHUB_TOKEN`

## TrueNAS Deployment

TrueNAS should pull:

- ghcr.io/christianrobertson36/dcam-api:v7
- ghcr.io/christianrobertson36/dcam-web:v7

Keep ports:

- Web external: 3096
- API external: 5056
- API internal: 5055

Keep storage paths:

- /mnt/APP_POOL/dcam/postgres
- /mnt/APP_POOL/dcam/uploads
- /mnt/APP_POOL/dcam/backups

## Important Boundary

GitHub-hosted runners cannot normally reach the local TrueNAS address `192.168.1.177`.

Automated TrueNAS redeploy from GitHub would require one of:

- a self-hosted GitHub Actions runner on the same LAN as TrueNAS
- a secure VPN/tunnel from GitHub Actions to the LAN
- a TrueNAS API token plus a reachable TrueNAS API endpoint

Until one of those exists, the safe update flow is:

1. Push code to GitHub.
2. Confirm GitHub Actions publishes the fixed image tags.
3. Update/redeploy the TrueNAS app to pull those fixed tags.
