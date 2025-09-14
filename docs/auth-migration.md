# Auth Mode Centralization & Migration Guide

This project originally defaulted to `apiKey` authorization (public read patterns for marketing/blog content). We have centralized auth handling to ease a future migration to `userPool` as the default.

## Helpers

- `withUserAuth(options?)` – Forces `{ authMode: 'userPool' }` on the supplied options object.
- `withPublic(options?)` – Forces `{ authMode: 'apiKey' }` for explicit public reads (useful after flipping defaults).
- `withAuth(options?)` – Neutral helper that injects `DEFAULT_AUTH_MODE` (currently `undefined` so Amplify chooses project default).

## Current Strategy

1. Keep backend `defaultAuthorizationMode: 'apiKey'` to allow anonymous reads of blog/tag/category/author models.
2. All protected model operations (organizations, entitlements, invites, admin blog mutations) now call `withUserAuth()` instead of embedding raw `{ authMode: 'userPool' }`.
3. A custom ESLint rule (`require-auth-mode`) warns if a `client.models.<Model>.<op>` call lacks an auth wrapper or inline `authMode`.

## Flipping the Default Later

When ready to require authenticated sessions by default:

1. Set `DEFAULT_AUTH_MODE = 'userPool'` in `src/amplifyClient.ts`.
2. (Optional) Update `amplify/data/resource.ts` -> `defaultAuthorizationMode: 'userPool'`.
3. For endpoints needing anonymous read (marketing/blog), wrap calls with `withPublic()`.
4. Remove redundant `withUserAuth()` where `withAuth()` or no override suffices.
5. Run lint; resolve any `require-auth-mode` warnings.

## ESLint Rule Behavior

The rule flags any `client.models.<Model>.<operation>(...)` call whose first argument is not:
- An object containing `authMode`, or
- A call expression to `withUserAuth()`, `withPublic()`, or `withAuth()`.

This aims to prevent accidental omission during or after migration.

## FAQ

**Q: Why not flip the default now?**  
Because public marketing/blog consumption would break for unauthenticated visitors. We defer until we introduce a public content delivery strategy (SSR cache, static export) or accept gated reads.

**Q: Do I always need a helper on mutations?**  
Yes while default is `apiKey` and the model is not publicly writable. Using `withUserAuth()` ensures consistent intent.

**Q: What about GraphQL operations outside models?**  
Add wrappers similarly; extend the rule if we introduce raw GraphQL client usage patterns.

---
_Last updated: auto-generated migration doc._
