# MemoriPilot: System Architect

## Overview
This file contains the architectural decisions and design patterns for the MemoriPilot project.

## Architectural Decisions

Use Vue 3 SPA for frontend with theme support.
Use Amplify Gen2 for backend, storage, and data.
Use Cedar for authorization policies.
Integrate PandaDoc and GitHub for contracts and code.
Use Amplify Gen2 and npx ampx for backend.
Centralize business logic in composables.
Sidebar navigation as source of truth for admin routes.
Risk-based severity matrix (likelihood x impactLevel) supersedes manual severity selection.
Live vulnerability template reuse to accelerate finding creation and ensure consistency.

## Design Considerations

All UI must support both dark and light themes.
Extensible service/asset model for future services.
Role-based access control using Cedar policies.
Integrate with existing technologies unless reviewed.
Strict TypeScript typing.
Amplify Gen2 workflows (npx ampx).
Modular architecture.
Full-width responsive UI.
Deterministic severity derivation (data -> severity) for auditability.



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

### Admin Dashboard
Custom sidebar navigation, full-width layout, persistent state, modular page views.

### Amplify Data Client
Strictly typed data access using generated Schema types, CRUD via composables.
- Store and retrieve files
 - Derive risk severity on the fly using shared risk service utilities (no duplicated matrices in components)

### Risk & Severity Derivation
Central utility (`risk.ts`) maps (likelihood, impactLevel) -> severity via matrix and can infer defaults from CVSS base metrics. Components watch likelihood/impactLevel changes and recompute severity automatically instead of storing redundant state. This reduces user error and enables future tuning of the matrix without mass data migrations.

### Template Reuse Flow
Finding creation modal performs in-memory filtered search over loaded `VulnerabilityTemplate` records. On selection, content fields (title, description, impact, remediation, references, cvssVector, likelihood, impactLevel) are populated; severity becomes derived and editable only through risk inputs, not directly.
