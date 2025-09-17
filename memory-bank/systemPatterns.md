# System Patterns

## Architectural Patterns
- Modular Vue 3 composables and components
- Strict TypeScript usage
- Amplify Gen2 data access
- Sidebar navigation as source of truth
- Centralized routing
- Vite build and Amplify CLI workflows

## Design Patterns & Idioms
- Business logic in `src/composables`
- UI in `src/components`
- Admin dashboard in `src/pages/AdminDashboard.vue`
- Sidebar in `src/components/AdminSidebar.vue`
- Routing in `src/router.ts`
- Amplify Data client with generated types
- Risk derivation centralized in `src/services/risk.ts`
- Live template reuse pattern in finding editor
- Graceful schema mismatch fallback (retry create without unknown field)

## Theme Support (Dark/Light)
All UI components and pages support both dark and light themes. Theme switching is seamless and accessible from any page, using CSS variables and modular styles for maintainability.


## Composable Auth Wrappers

All data-access composables now consistently use withUserAuth for protected admin-only metadata models while leaving public models with default or withPublic; this isolates auth mode decisions centrally and avoids silent Unauthorized GraphQL errors.

### Examples

- useApplicationTypes.ts uses withUserAuth
- useUserTypes.ts uses withUserAuth
- useMigrations.ts adds Authorization header for REST endpoints
- useVulnerabilityTemplates.ts implements safe create with impactLevel retry
- FindingEditorModal auto-fills from template and derives severity reactively
