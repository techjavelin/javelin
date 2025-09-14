# Newsletter Double Opt-In & Management

## Overview
Implements a GDPR-friendly double opt-in workflow with explicit confirmation and unsubscribe token flows. Adds pagination, metrics, and public self-service pages.

## Data Model Changes
- Newsletter: added `status` enum (PENDING, ACTIVE, UNSUBSCRIBED) + `confirmationToken` (last issued reference) + existing timestamps used.
- NewsletterConfirmationToken: ephemeral tokens for confirmation and unsubscribe flows with `expiresAt` + optional `usedAt`.

## State Transitions
PENDING -> (confirm) -> ACTIVE -> (unsubscribe) -> UNSUBSCRIBED
UNSUBSCRIBED -> (re-subscribe start) -> PENDING

## Public Pages & Routes
- `/subscribe` (NewsletterSubscribe.vue): Start flow; sends confirmation token.
- `/subscribe/confirm?token=...` (SubscribeConfirm.vue): Consumes CONFIRM token, activates subscription.
- `/unsubscribe` (Unsubscribe.vue): Request unsubscribe OR finalize via token `?token=...`.

## Composables
- `useNewsletter` (admin): Now supports pagination (pageSize, loadMore, nextToken) and status-based lifecycle.
- `useNewsletterPublic`: Public workflow (startSubscription, confirm, requestUnsubscribe, finalizeUnsubscribe).

## Metrics (AdminSubscribers.vue)
Computed client-side from loaded pages:
- Active count
- Pending count
- Unsubscribed count
- New (7d) based on `subscribedAt`

## Pagination (Admin)
Uses Amplify list `nextToken` and `limit` (pageSize) to progressively load subscribers. UI includes Load More button + page size selector.

## Security & Auth
- Public creation of Newsletter entries limited to starting subscription (apiKey rule for create).
- Tokens also created publicly; confirmation transitions handled with public update operations. (Consider tightening with a server-side function if abuse observed.)
- Admin management still requires userPool + admin group.

## Future Enhancements
- Email delivery integration (SES or third-party) for tokens.
- Background cleanup for expired tokens.
- Server-side rate limiting & CAPTCHA for sign-up and unsubscribe requests.
- Metrics aggregation via dedicated analytics table/functions.

## Developer Notes
If default auth mode switches to userPool later, ensure `allow.publicApiKey()` stays for Newsletter + NewsletterConfirmationToken models or add `withPublic()` helper at call sites.
