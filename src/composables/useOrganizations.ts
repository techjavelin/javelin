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

  async function createOrganization(input: { name: string; admins: string[]; members?: string[] }) {
    creating.value = true
    error.value = null
    try {
      if (!input.name || !input.admins?.length) throw new Error('Name and at least one admin required')
      const { data } = await client.models.Organization.create({
        name: input.name,
        admins: input.admins,
        members: input.members || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      if (data) organizations.value = [data, ...organizations.value]
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
