## AWS Amplify Vue.js Starter Template

This repository provides a starter template for creating applications using Vue.js and AWS Amplify, emphasizing easy setup for authentication, API, and database capabilities.

## Overview

Javelin is a SaaS product offered by Tech Javelin Ltd (techjavelin.com), designed to provide a variety of information, application, and social security services to clients. Built on a scalable Vue.js and AWS Amplify foundation, Javelin streamlines service delivery for organizations and individuals seeking secure, reliable, and modern solutions.

## Features

- **Authentication**: Setup with Amazon Cognito for secure user authentication.
- **API**: Ready-to-use GraphQL endpoint with AWS AppSync.
- **Database**: Real-time database powered by Amazon DynamoDB.

## Environment Configuration

Certain runtime behaviors depend on environment variables loaded via Vite's `.env` system (e.g. `.env`, `.env.local`). Copy `.env.example` to `.env.local` and fill in the values as needed.

### `VITE_ADMIN_API_BASE`
Base URL (no trailing slash) for custom Admin REST endpoints (invite / activation flows, etc.).

Auto-derivation: If you omit this variable, the app attempts to derive a base from `amplify_outputs.json` under `custom.API` (e.g. the `Sigint API` endpoint). If found, that endpoint (minus trailing slash) becomes the base automatically. Set `VITE_ADMIN_API_BASE` only to override or when multiple custom APIs exist and you need to select a specific one.

Explicit override example:
```
VITE_ADMIN_API_BASE=https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod
```

Failure behavior: If neither env nor `amplify_outputs.json` provide an endpoint, requests use the sentinel path `/admin-api-misconfigured` and a one-time console warning appears: `[AdminAPI] VITE_ADMIN_API_BASE not set...`.

After adding/updating the variable, restart the dev server (`npm run dev`).

Security note: Do NOT commit real environment-specific values; rely on `.env.local` (gitignored). Ensure `amplify_outputs.json` does not contain secrets (it should only have public resource identifiers and is safe for inclusion in the repo).

## Health & Diagnostics

A public `GET /health` endpoint is exposed (no auth) to allow the frontend and CI to verify base API reachability and CORS configuration. Response shape:
```json
{
	"status": "ok",
	"service": "pulse-sigint-api",
	"ts": "<ISO timestamp>",
	"region": "us-east-1"
}
```

### Integration Check Script
Run a quick verification (auto-discovers REST base from `amplify_outputs.json`):
```
npm run test:integration
```
Override detection (choose one):
```
# Explicit flag
tsx scripts/check-api-health.ts --base https://<apiId>.execute-api.<region>.amazonaws.com/dev

# Or environment variable override
VITE_ADMIN_API_BASE=https://<apiId>.execute-api.<region>.amazonaws.com/dev npm run test:integration
```
What the script validates:
- 200 OK from `/health`
- JSON payload includes `status: ok`
- OPTIONS preflight for `/invite-admin-user` returns `Access-Control-Allow-Origin` and includes POST in allowed methods

CI Recommendation: Add this script early in your pipeline to fail fast on endpoint / CORS regressions before running any UI or E2E suites.

#### CORS vs 401 Unauthorized (Frontend Gotcha)
If the browser console shows a generic "CORS" or "TypeError: Failed to fetch" message when calling protected endpoints, first verify:
- The `OPTIONS` preflight (see integration script) succeeds.
- The **actual POST** returns `401` (check Network tab). A 401 can be misinterpreted as a CORS failure when the Authorization header is missing.

Frontend fixes applied:
- All organization invite / activation REST calls now attach an `Authorization: Bearer <idToken>` header via a shared `buildAuthHeaders` helper.
- 401 responses are surfaced with a clearer message: `Not authorized (check login / token)`.

If you still see a true CORS issue (missing `Access-Control-Allow-Origin`), ensure the API Gateway resource method exists and the `defaultCorsPreflightOptions` hasn't been overridden.

### Organization Management (UI)
The Admin Organizations page now supports:
- Rename (inline edit) of an organization name.
- Delete (with lightweight confirmation prompt) of an organization.

Implementation details:
- Uses Amplify Data model operations (`Organization.update` / `Organization.delete`) via the existing authenticated client (`withUserAuth`).
- Local state is updated optimistically after successful mutation; errors surface through unified toast + inline message (`actionMessage`).
- Delete currently performs a hard removal; future enhancement could introduce a soft-delete flag or archive model.

Backend note: Only `createOrganization` custom REST function is currently provisioned; update & delete rely on generated GraphQL resolvers. If you later add REST wrappers for audit logging, you can swap the composable calls with REST fetch helpers while preserving the UI layer unchanged.

## Observability & Error Handling

### Backend Structured Logging
All Lambda / function handlers now use a shared structured logger at `amplify/functions/logger.ts`.

Key characteristics:
- JSON lines output (one object per log line) for easy ingestion by CloudWatch / log tooling.
- Log levels: `debug`, `info`, `warn`, `error` (controlled via `LOG_LEVEL` env var; default `info`).
- Automatic redaction of obvious secret-like keys (password, token, secret, authorization).
- Consistent usage at handler entry, validation branches, external service calls, success, and error paths.

Basic usage inside a handler:
```ts
import { logger } from '../logger'

export const handler = async (event: any) => {
	logger.debug('handler:start', { requestId: event?.requestContext?.requestId })
	try {
		// ... business logic
		logger.info('handler:success', { resultCount: 5 })
		return { statusCode: 200, body: JSON.stringify({ ok: true }) }
	} catch (err: any) {
		logger.error('handler:error', { message: err.message, stack: err.stack })
		return { statusCode: 500, body: JSON.stringify({ error: 'Internal error' }) }
	}
}
```

Set a lower level for verbose debugging during development:
```bash
export LOG_LEVEL=debug
```

### Frontend Unified API Error Handling
A composable `useApi` provides `withErrorToast(label, fn, options)` to wrap any async API / data client call. It ensures:
- Automatic toast on failure (unless `suppressToast` is set).
- Inspection of successful (HTTP 200 / resolved) responses for embedded error envelopes: `{ error: string | { message } }`, `{ errors: [...] }`, or nested `error` object.
- Friendly fallback messaging & optional null/undefined guarding (`disallowNull`).
- Rethrows the underlying (normalized) error so callers can still branch if needed.

Example:
```ts
import { useApi } from '@/composables/useApi'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/../amplify/data/resource'

const client = generateClient<Schema>()
const { withErrorToast } = useApi()

async function loadPosts() {
	const result = await withErrorToast('Load Posts', () => client.models.BlogPost.list())
	// result is the raw model list response if successful
	return result
}
```

Options shape (`WithErrorToastOptions`):
- `title?: string` override toast title
- `fallbackMessage?: string` custom fallback message
- `suppressToast?: boolean` avoid showing a toast but still throw
- `disallowNull?: boolean` convert null/undefined resolution into an error

Error message derivation order:
1. `error` string
2. `error.message`
3. `message`
4. First `errors[]` entry or its `.message`
5. Fallback label-derived message

This guarantees silent logical failures (where the backend returns HTTP 200 yet embeds an error) surface consistently to users.

### Adding to New Code
When creating new composables or services:
1. Perform raw call in a small lambda passed to `withErrorToast`.
2. Prefer concise labels matching user intent ("Create Tag", "Reset Password", etc.).
3. Only catch & swallow errors at the *UI interaction* boundary (e.g., to keep a modal open); otherwise let errors propagate after toast.

If a call already returns a standard `{ error }` structure, no extra branching needed—wrapper handles it.

## Deploying to AWS

For detailed instructions on deploying your application, refer to the [deployment section](https://docs.amplify.aws/vue/start/quickstart/#deploy-a-fullstack-app-to-aws) of our documentation.


## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.