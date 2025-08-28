# MemoriPilot: System Architect

## Overview
This file contains the architectural decisions and design patterns for the MemoriPilot project.

## Architectural Decisions

- Use Amplify Gen2 and npx ampx for backend
- Centralize business logic in composables
- Sidebar navigation as source of truth for admin routes



1. **Decision 1**: Description of the decision and its rationale.
2. **Decision 2**: Description of the decision and its rationale.
3. **Decision 3**: Description of the decision and its rationale.



## Design Considerations

- Strict TypeScript typing
- Amplify Gen2 workflows (npx ampx)
- Modular architecture
- Full-width responsive UI



## Components

### Frontend (Vue 3)

SPA using Vue 3 Composition API and TypeScript, modular components and composables, full-width responsive layouts, admin dashboard with sidebar.

### Backend (Amplify Gen2)

AWS Amplify Gen2 backend, Cognito for auth, AppSync for GraphQL, DynamoDB for data, type generation in amplify/data/resource.ts. Use `npx ampx sandbox seed` to seed the database

### Admin Dashboard

Custom sidebar navigation, full-width layout, persistent state, modular page views.

### Amplify Data Client

Strictly typed data access using generated Schema types, CRUD via composables.



