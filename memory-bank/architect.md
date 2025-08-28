# MemoriPilot: System Architect

## Overview
This file contains the architectural decisions and design patterns for the MemoriPilot project.

## Architectural Decisions

- Use Vue 3 SPA for frontend with theme support.
- Use Amplify Gen2 for backend, storage, and data.
- Use Cedar for authorization policies.
- Integrate PandaDoc and GitHub for contracts and code.



- Use Vue 3 SPA for frontend with theme support.
- Use Amplify Gen2 for backend, storage, and data.
- Use Oso for authorization policies.
- Integrate PandaDoc and GitHub for contracts and code.



- Use Amplify Gen2 and npx ampx for backend
- Centralize business logic in composables
- Sidebar navigation as source of truth for admin routes



1. **Decision 1**: Description of the decision and its rationale.
2. **Decision 2**: Description of the decision and its rationale.
3. **Decision 3**: Description of the decision and its rationale.



## Design Considerations

- All UI must support both dark and light themes.
- Extensible service/asset model for future services.
- Role-based access control using Cedar policies.
- Integrate with existing technologies unless reviewed.



- All UI must support both dark and light themes.
- Extensible service/asset model for future services.
- Role-based access control using Oso policies.
- Integrate with existing technologies unless reviewed.



- Strict TypeScript typing
- Amplify Gen2 workflows (npx ampx)
- Modular architecture
- Full-width responsive UI



## Components

### Pulse Client Hub Frontend

Vue 3 SPA for client portal, supporting dark and light themes. Modular components for contracts, projects, assets, scheduling, and engagement requests.

**Responsibilities:**

- UI/UX for all client hub features
- Theme switching (dark/light)
- Integrate with PandaDoc, Amplify Storage, GitHub

### Pulse Client Hub Backend

Amplify Gen2 backend with GraphQL API, DynamoDB, and Storage APIs. Handles business logic, data access, and integrations.

**Responsibilities:**

- Data models for orgs, users, projects, assets, roles
- Integrate with PandaDoc, GitHub, Cedar authorization
- Asset storage and retrieval

### Authorization Service (Cedar)

Policy-as-code authorization using Cedar policies. Centralized role and permission management for organizations, users, projects, and assets.

**Responsibilities:**

- Define and enforce access policies
- Integrate with backend and frontend for role checks

### Asset Storage Service

Amplify Gen2 Storage APIs for secure upload/download of project assets and deliverables.

**Responsibilities:**

- Store and retrieve files
- Associate assets with projects/services

### External Integrations

APIs for PandaDoc (contracts), GitHub (repos), and future vulnerability management.

**Responsibilities:**

- Contract retrieval and download
- Repo access and metadata
- Prepare for vulnerability app integration





### Pulse Client Hub Frontend

Vue 3 SPA for client portal, supporting dark and light themes. Modular components for contracts, projects, assets, scheduling, and engagement requests.

**Responsibilities:**

- UI/UX for all client hub features
- Theme switching (dark/light)
- Integrate with PandaDoc, Amplify Storage, GitHub

### Pulse Client Hub Backend

Amplify Gen2 backend with GraphQL API, DynamoDB, and Storage APIs. Handles business logic, data access, and integrations.

**Responsibilities:**

- Data models for orgs, users, projects, assets, roles
- Integrate with PandaDoc, GitHub, Oso authorization
- Asset storage and retrieval

### Authorization Service (Oso)

Policy-as-code authorization using Polar policies. Centralized role and permission management for organizations, users, projects, and assets.

**Responsibilities:**

- Define and enforce access policies
- Integrate with backend and frontend for role checks

### Asset Storage Service

Amplify Gen2 Storage APIs for secure upload/download of project assets and deliverables.

**Responsibilities:**

- Store and retrieve files
- Associate assets with projects/services

### External Integrations

APIs for PandaDoc (contracts), GitHub (repos), and future vulnerability management.

**Responsibilities:**

- Contract retrieval and download
- Repo access and metadata
- Prepare for vulnerability app integration





### Frontend (Vue 3)

SPA using Vue 3 Composition API and TypeScript, modular components and composables, full-width responsive layouts, admin dashboard with sidebar.

### Backend (Amplify Gen2)

AWS Amplify Gen2 backend, Cognito for auth, AppSync for GraphQL, DynamoDB for data, type generation in amplify/data/resource.ts. Use `npx ampx sandbox seed` to seed the database

### Admin Dashboard

Custom sidebar navigation, full-width layout, persistent state, modular page views.

### Amplify Data Client

Strictly typed data access using generated Schema types, CRUD via composables.



