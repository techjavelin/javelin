import { ref } from 'vue'
import type { Schema } from '../../amplify/data/resource'
import { getClient } from '../amplifyClient'

export function useOrganizations() {
  const client = getClient()
  const organizations = ref<Schema['Organization']['type'][]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const creating = ref(false)

  async function fetchOrganizations(options?: { force?: boolean }) {
    if (!options?.force && organizations.value.length > 0) return
    loading.value = true
    error.value = null
    try {
      const result = await client.models.Organization.list({ limit: 100 })
      organizations.value = result.data || []
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
      if (!input.name || !input.adminEmail) throw new Error('Name and admin email required')
      const adminEmail = input.adminEmail.trim().toLowerCase()
      const { data } = await client.models.Organization.create({
        name: input.name,
        admins: [adminEmail],
        members: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      if (data) {
        organizations.value = [data, ...organizations.value]
        // Call invite function (fire-and-forget but we can await to report errors)
        try {
          await fetch(import.meta.env.VITE_ADMIN_API_BASE + '/invite-admin-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: adminEmail,
              organizationId: data.id,
              organizationName: data.name,
              sendEmail: true
            })
          })
        } catch (invErr: any) {
          console.warn('Invite admin failed', invErr)
        }
      }
      return data
    } catch (e: any) {
      error.value = e.message || 'Failed to create organization.'
      return null
    } finally {
      creating.value = false
    }
  }

  return {
    organizations,
    loading,
    creating,
    error,
    fetchOrganizations,
    createOrganization
  }
}
