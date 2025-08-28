# Copilot Instructions for Javelin (Tech Javelin Ltd)

## Big Picture Architecture
- **Frontend:** Vue 3 (Composition API, TypeScript) in `src/` with modular components and pages. Main entry: `src/main.ts`, root component: `src/App.vue`.
- **Backend:** AWS Amplify Gen2 (see `amplify/`), with generated types in `amplify/data/resource.ts`. Data access via Amplify Data client (`generateClient<Schema>()`).
- **Auth:** Amazon Cognito, integrated via Amplify Auth composables and middleware.
- **API:** GraphQL (AWS AppSync) with models defined in Amplify schema, accessed via generated client.
- **Database:** DynamoDB, abstracted through Amplify Data models.
- **Admin Dashboard:** Custom sidebar navigation (`src/components/AdminSidebar.vue`), full-width layout (`src/pages/AdminDashboard.vue`).

## Developer Workflows
- **Build:** Use Vite (`vite.config.ts`). Build with `npm run build`.
- **Dev:** Start with `npm run dev` (hot reload, Vite).
- **Type Checking:** Run `npx tsc --noEmit` for strict TypeScript validation.
- **Amplify Backend:** Use Amplify CLI (`npx ampx sandbox`), see `amplify.yml` for CI/CD.

## Project-Specific Conventions
- **Composables:** All business/data logic in `src/composables/`. Use strict TypeScript types from `amplify/data/resource.ts`.
- **Components:** Use PascalCase for Vue components. Group icons in `src/components/icons/`.
- **Routing:** Centralized in `src/router.ts`. Admin routes require authentication.
- **Styling:** Use CSS modules in `src/assets/`. Layouts use Flexbox for full-width responsiveness.
- **Sidebar:** Collapsible, persistent state via localStorage in `AdminSidebar.vue`.

## Integration Points
- **Amplify Data Client:** Always use generated types for models (e.g., `Schema['BlogPost']['type']`).
- **Auth:** Use Amplify composables for login/logout/user info.
- **GraphQL:** Access via Amplify client, never direct fetch.
- **Admin UI:** Sidebar navigation is the source of truth for admin routes.

## Patterns & Examples
- **Composable Example:** See `src/composables/useBlog.ts` for blog CRUD using Amplify Data client and strict types.
- **Sidebar Example:** See `src/components/AdminSidebar.vue` for navigation, user info, and collapse logic.
- **Type Usage:** Always import types from `amplify/data/resource.ts` for model safety.

## Key Files & Directories
- `src/composables/` — Business/data logic
- `src/components/` — UI components
- `src/pages/` — Page-level views
- `src/router.ts` — Route definitions
- `amplify/` — Backend schema, type generation
- `amplify/data/resource.ts` — Generated types
- `vite.config.ts` — Vite build config
- `amplify.yml` — Amplify CI/CD config

---
If any conventions or workflows are unclear, please ask for clarification or provide feedback to improve these instructions.
