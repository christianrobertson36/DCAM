# DCAM v52 Microsoft SSO Foundation

## Purpose

DCAM can now authenticate invited users through Microsoft Entra ID while continuing to use DCAM roles, permissions and data scopes for authorisation.

## Registration

- Application type: multitenant organisational accounts
- Client ID: `262a87a9-8711-4376-b574-72ffa987346b`
- Home tenant ID: `30ea35db-4a7d-4064-a43d-340618535fbd`
- Redirect URI: `https://dcam.ctec-shop.co.uk/auth/microsoft/callback`

The application object ID is not required at runtime.

## Required production environment

```text
MICROSOFT_CLIENT_ID=262a87a9-8711-4376-b574-72ffa987346b
MICROSOFT_CLIENT_SECRET=<stored privately in TrueNAS>
MICROSOFT_HOME_TENANT_ID=30ea35db-4a7d-4064-a43d-340618535fbd
MICROSOFT_REDIRECT_URI=https://dcam.ctec-shop.co.uk/auth/microsoft/callback
DCAM_PUBLIC_URL=https://dcam.ctec-shop.co.uk
```

Never commit the client secret.

## Security model

- OAuth 2.0 authorisation code flow with PKCE, state and nonce.
- Microsoft tokens are validated using Microsoft's published signing keys.
- Tenant ID and object ID are used as the permanent external identity.
- The home tenant is allowed automatically.
- Other organisational tenants must be approved in `microsoft_tenants`.
- Users are invite-only. A matching active DCAM user must already exist.
- The first successful sign-in links the existing user by matching email.
- Microsoft authentication does not grant DCAM permissions. DCAM's role and permission system remains authoritative.
- Local sign-in remains available as an administrator recovery route.

## First sign-in

Before testing, create or update an active DCAM user so its email exactly matches the user's Microsoft work account. The first Microsoft sign-in links that user to its immutable Entra tenant and object IDs.

## Current limitation

External customer tenant approval is stored in the database. A friendly administration screen for approving additional Microsoft tenants is planned as the next SSO administration enhancement.
