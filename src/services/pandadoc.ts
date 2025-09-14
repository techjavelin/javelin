import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { withAuth } from '../amplifyClient'

/**
 * Pandadoc integration stub: creates an ArtifactLink record referencing a Pandadoc envelope or document.
 * Replace the internal mock implementation with real Pandadoc API calls (OAuth / API key) later.
 */
const client = generateClient<Schema>()

export interface CreatePandadocArtifactInput {
  engagementId?: string
  organizationId?: string
  documentType?: any // generated enum ref typing not surfaced directly; kept loose here
  name: string
  description?: string
  externalId?: string // if already created externally
  metadata?: Record<string, any>
  status?: any
}

export async function createPandadocArtifact(input: CreatePandadocArtifactInput) {
  // Simulate external ID issuance if not provided
  const externalId = input.externalId || `pd_${Math.random().toString(36).slice(2,10)}`

  const res = await client.models.ArtifactLink.create(withAuth({
    provider: 'PANDADOC',
    documentType: input.documentType,
    externalId,
    name: input.name,
    description: input.description,
    metadata: {
      ...(input.metadata || {}),
      stub: true
    },
    status: input.status,
    engagementId: input.engagementId,
    organizationId: input.organizationId
  }))

  return res.data
}

export async function updatePandadocArtifactStatus(id: string, status: any) {
  const res = await client.models.ArtifactLink.update(withAuth({ id, status }))
  return res.data
}

export async function listPandadocArtifactsForEngagement(engagementId: string) {
  // Placeholder: list all then filter (predicate API improvements later)
  const res = await client.models.ArtifactLink.list(withAuth({}))
  return (res.data || []).filter(a => (a as any).provider === 'PANDADOC' && (a as any).engagementId === engagementId)
}
