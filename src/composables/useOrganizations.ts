import { ref } from 'vue'
import { useAuth } from './useAuth'
import type { Schema } from '../../amplify/data/resource'
import { getClient, withUserAuth } from '../amplifyClient'
import { useApi } from './useApi'
import { buildAdminApiPath } from '../utils/apiBase'
import { buildAuthHeaders } from '../utils/authHeaders'

export function useOrganizations() {
  const client = getClient()
  const organizations = ref<Schema['Organization']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const creating = ref(false)
  // track invite statuses per org id
  const inviteStatus = ref<Record<string, { lastAttempt?: string; lastResult?: 'success' | 'failure'; message?: string }>>({})
  const { withErrorToast } = useApi()

  async function fetchOrganizations(options?: { force?: boolean }) {
    if (!options?.force && organizations.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      const result = await withErrorToast('Load Organizations', async () => client.models.Organization.list(withUserAuth({ limit: 100 })))
      organizations.value = (result as any).data || []
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch organizations.'
    } finally {
      loading.value = false
    }
  }

  async function createOrganization(input: { name: string; adminEmail: string }) {
    creating.value = true
    error.value = null
    try {
      const data = await withErrorToast('Create Organization', async () => {
        if (!input.name || !input.adminEmail) throw new Error('Name and admin email required')
        const adminEmail = input.adminEmail.trim().toLowerCase()
        const existing = organizations.value.find((o: Schema['Organization']['type']) => o.status === 'PENDING' && (o.invitedAdminEmail || '').toLowerCase() === adminEmail)
        if (existing) {
          throw new Error('A pending organization already exists for that admin email.')
        }
        let createdBy: string | undefined = undefined
        try {
          const { userEmail, isAuthenticated } = useAuth()
          if (isAuthenticated.value && userEmail.value) createdBy = userEmail.value
        } catch {}
        const { data } = await client.models.Organization.create({
          name: input.name,
          // Add creator to admins so they retain read/update access through ownersDefinedIn('admins') rule.
          admins: createdBy ? [createdBy] : [],
          members: [],
          invitedAdminEmail: adminEmail,
            status: 'PENDING',
          createdBy,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }, withUserAuth())
        if (!data) throw new Error('Organization creation returned empty result')
        // Fire the invite call and inspect for errors in body even on 200
        await attemptInvite({ orgId: data.id, email: adminEmail, name: data.name })
        return data
      })
      if (data) {
        organizations.value = [data, ...organizations.value]
      }
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to create organization.'
      return null
    } finally {
      creating.value = false
    }
  }

  async function attemptInvite(params: { orgId: string; email: string; name: string }) {
    const orgId = params.orgId
    inviteStatus.value[orgId] = { ...(inviteStatus.value[orgId]||{}), lastAttempt: new Date().toISOString(), lastResult: undefined, message: 'Inviting...' }
    try {
        const url = buildAdminApiPath('/invite-admin-user')
        if (url.includes('admin-api-misconfigured')) {
          throw new Error('Admin API base could not be derived (set VITE_ADMIN_API_BASE or ensure amplify_outputs.json custom.API entry)')
        }
        const headers = await buildAuthHeaders({ 'Content-Type': 'application/json' })
        const resp = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            email: params.email,
            organizationId: orgId,
            organizationName: params.name,
            sendEmail: true
          })
        })
      let parsed: any = null
      try { parsed = await resp.clone().json() } catch {}
      if (!resp.ok || (parsed && (parsed.error || parsed.errors))) {
        const baseMsg = parsed?.error || parsed?.message || `Invite failed (${resp.status})`
        // Distinguish 401 unauthorized (often mis-read as CORS by fetch wrappers)
        if (resp.status === 401) {
          throw new Error(baseMsg + ' - not authorized (check login / token)')
        }
        throw new Error(baseMsg)
      }
      inviteStatus.value[orgId] = { ...inviteStatus.value[orgId], lastResult: 'success', message: 'Invite sent' }
      return true
    } catch (e: any) {
      console.warn('Invite admin failed', e)
      inviteStatus.value[orgId] = { ...inviteStatus.value[orgId], lastResult: 'failure', message: e.message || 'Invite failed' }
      return false
    }
  }

  async function resendInvite(org: Schema['Organization']['type']) {
    if (!org.invitedAdminEmail) {
      error.value = 'No invited admin email to resend.'
      return false
    }
    return await attemptInvite({ orgId: org.id, email: org.invitedAdminEmail, name: org.name })
  }

  async function updateOrganization(orgId: string, updates: { name?: string }) {
    error.value = null
    try {
      if (!updates.name || !updates.name.trim()) throw new Error('Name is required')
      const { data } = await withErrorToast('Update Organization', async () =>
        client.models.Organization.update({ id: orgId, name: updates.name!.trim(), updatedAt: new Date().toISOString() }, withUserAuth())
      )
      if (!data) throw new Error('Update returned empty result')
      organizations.value = organizations.value.map(o => o.id === orgId ? { ...o, ...data } : o)
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to update organization.'
      return null
    }
  }

  async function deleteOrganization(orgId: string, opts: { confirm?: boolean } = {}) {
    error.value = null
    try {
      if (opts.confirm === false) return false
      await withErrorToast('Delete Organization', async () =>
        client.models.Organization.delete({ id: orgId }, withUserAuth())
      )
      organizations.value = organizations.value.filter(o => o.id !== orgId)
      return true
    } catch (e: any) {
      error.value = e.message || 'Failed to delete organization.'
      return false
    }
  }

  return {
    organizations,
    loading,
    creating,
    error,
    fetchOrganizations,
    createOrganization,
    resendInvite,
    updateOrganization,
    deleteOrganization,
    inviteStatus
  }
}
