# System Patterns

## Architectural Patterns

- Pattern 1: Description

## Design Patterns

- Pattern 1: Description

## Common Idioms

- Idiom 1: Description

## Modular Vue 3 composables and components, strict TypeScript, Amplify Gen2 data access, sidebar navigation, Vite build, centralized routing.

Business logic in src/composables, UI in src/components, admin dashboard in src/pages/AdminDashboard.vue, sidebar in src/components/AdminSidebar.vue, routing in src/router.ts, Amplify Data client with generated types, strict TypeScript, Vite build, Amplify CLI workflows.

### Examples

- src/composables/useBlog.ts
- src/components/AdminSidebar.vue
- src/pages/AdminDashboard.vue
- src/router.ts


## Theme Support (Dark/Light)

All UI components and pages must support both dark and light themes. Theme switching should be seamless and accessible from any page. Use CSS variables and modular styles for maintainability.

### Examples

- Vue 3 components with theme-aware styles in src/assets/
- Theme switcher in top navigation
