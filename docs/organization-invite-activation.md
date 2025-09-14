# Organization Invite & Activation Flow

## Overview
This document explains the updated flow separating user invitation from privilege assignment. Activated organization users receive the minimally privileged `client` group role (not `admin`).

## Previous Behavior
The `invite-admin-user` Lambda both created (or idempotently ensured) the Cognito user and immediately added the user to the `admin` group.

## Current Behavior (Updated for client role)
1. Organization creation (`createOrganization`) stores `invitedAdminEmail` and sets status `PENDING`.
2. Invitation step (Lambda: `invite-admin-user`):
   - Creates the Cognito user if it does not exist (RESEND/SUPPRESS logic based on sendEmail flag).
   - Does NOT add the user to any Cognito group.
   - Returns message indicating no group assignment yet.
3. Activation step (Lambda: `activate-organization-admin`):
   - Adds invited email to the `admins` array on the Organization record (application-level tracking), sets status `ACTIVE`.
   - Attempts to look up the Cognito user; if found, adds the user to the `client` group at this time (NOT `admin`).
   - If the user account does not yet exist (race or external delay), activation still proceeds but logs a warning. A subsequent manual reconciliation utility could add the user to the `client` group later.

## Rationale
- Avoid granting elevated privileges to unverified or not-yet-onboarded accounts.
- Aligns with principle of least privilege: activation grants only `client` capabilities.
- Allows future insertion of verification or acceptance steps between invite and activation.
- Enables separate, auditable promotion path from `client` to `admin` if needed.

## Edge Cases
- Activation before user formation: Logs warning; group membership deferred.
- Repeated activation calls: Idempotent; returns early if already ACTIVE.
- Re-invite: Allowed; front-end surfaces invite status per organization.
- Promotion to admin (future): Should be a distinct, audited operation.

## Front-End Changes
- `useOrganizations` composable tracks `inviteStatus` per org.
- `AdminOrganizations.vue` displays real-time invite status and provides a "Resend Invite" button.
- API base path normalized via `buildAdminApiPath` helper; misconfiguration yields a clear error message.

## Future Enhancements
- Add explicit verification token step before activation.
- Implement automatic reconciliation job to ensure active org admins exist in Cognito groups.
- Introduce audit model recording each invite and activation event.
- Separate Lambda / mutation to promote/demote between `client` and `admin` with audit trail.

## Environment Variable
The admin API base is auto-derived from `amplify_outputs.json` (custom API endpoint) if `VITE_ADMIN_API_BASE` is not explicitly set. To override or when multiple endpoints exist, set `VITE_ADMIN_API_BASE` (e.g. `https://xyz.execute-api.region.amazonaws.com/prod`) without a trailing slash.

