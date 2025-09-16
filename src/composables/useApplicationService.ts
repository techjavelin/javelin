import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { useAuthorization } from './useAuthorization'
import { useAuth } from './useAuth'

// Service-layer guard + convenience operations for Application model since owner rule removed.
export function useApplicationService() {
  const client = generateClient<Schema>()
  const { has, primeContext } = useAuthorization()
  const { currentUser, loadCurrentUser } = useAuth()

  async function ensureUser() {
    if (!currentUser.value) await loadCurrentUser()
  }

  function requireCapability(cap: string, ctx: { organizationId?: string }) {
    if (!has(cap as any, { organizationId: ctx.organizationId })) {
      throw new Error('Forbidden: missing capability ' + cap)
    }
  }

  async function updateApplication(input: Partial<Schema['Application']['type']> & { id: string }) {
    await ensureUser()
    // Prime context for org-level roles first
  const existing = await client.models.Application.get({ id: input.id })
    if (!existing.data) throw new Error('Application not found')
    await primeContext({ organizationId: existing.data.organizationId })
    requireCapability('APP.MANAGE', { organizationId: existing.data.organizationId })
    const { id, ...rest } = input
  return client.models.Application.update({ id, ...rest })
  }

  async function deleteApplication(id: string) {
    await ensureUser()
  const existing = await client.models.Application.get({ id })
    if (!existing.data) throw new Error('Application not found')
    await primeContext({ organizationId: existing.data.organizationId })
    requireCapability('APP.MANAGE', { organizationId: existing.data.organizationId })
  return client.models.Application.delete({ id })
  }

  return {
    updateApplication,
    deleteApplication
  }
}
