# Subscribers Admin UI

Implemented an administrative interface for managing newsletter subscribers.

## Features
- List subscribers (lazy load with caching; force refresh button)
- Search by email or name
- Filter by status (subscribed / unsubscribed)
- Add subscriber (email, name, frequency, topics)
- Toggle subscription (unsubscribe / resubscribe)
- Delete subscriber (with optimistic UI + rollback on failure)
- Export CSV (includes key fields: Email, Name, Status, Frequency, Topics, timestamps)

## Data Model
Uses Amplify `Newsletter` model (supports public create via apiKey for self-serve signups; admin full CRUD).

## Auth Strategy
All admin operations use `withUserAuth()` helper to enforce authenticated (userPool) access. Public on-site signup can still leverage apiKey create rule without modification.

## Composable
`useNewsletter` now provides:
- `fetchSubscribers(options?)`
- `subscribe(email, name?, frequency, topics[])`
- `toggleSubscription(id, isSubscribed)`
- `removeSubscriber(id)`
- `exportCsv()`
- Reactive state: `subscribers`, `loading`, `error`, `successMessage`, `lastFetchedAt`

## Future Enhancements
- Pagination for large subscriber lists
- Bulk actions (bulk unsubscribe / export subset)
- Metrics (daily new subs, churn rate) integration into Analytics page
- Double opt-in workflow integration

_Last updated: automated doc generation._
