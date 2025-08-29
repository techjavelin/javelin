
# Javelin Pulse Platform Context

Javelin Pulse is the unified SaaS platform by Tech Javelin Ltd, delivering secure, scalable, and extensible business applications. Each application—such as Pulse Client Hub (client portal) and Pulse SigInt (automated OSINT monitoring)—is a module within the Javelin Pulse ecosystem, sharing a consistent look, feel, and user experience.

The platform provides a centralized portal for clients to access information, read news, interact with professional and managed services, and manage contracts, projects, and assets. All modules leverage shared authentication, authorization, and UI/UX patterns for seamless navigation and branding.

## Core Features
- Contract management
- Project scheduling
- Asset upload/download
- Engagement requests
- Future vulnerability management

## Technical Stack
- Vue 3 (Composition API, TypeScript)
- Amplify Gen2 (GraphQL, DynamoDB, Storage)
- Cedar (authorization)
- Cognito (authentication)
- AppSync (GraphQL API)
- Vite (build)

## Architecture
Pulse Client Hub consists of a Vue 3 SPA frontend (with dark/light theme support), an Amplify Gen2 backend (GraphQL, DynamoDB, Storage APIs), Cedar for authorization, and integrations with PandaDoc and GitHub. Extensible asset/service model for future services.

Frontend: Vue 3 (Composition API, TypeScript) in src/. Backend: AWS Amplify Gen2, Cognito for auth, AppSync for GraphQL, DynamoDB for data. Modular composables, admin dashboard, sidebar navigation, strict typing, Vite build, Amplify CLI.

## Libraries and Dependencies
- Vue 3
- Amplify Gen2
- Cedar
- PandaDoc API
- GitHub API
- Amazon Cognito
- AWS AppSync
- DynamoDB
- Vite

