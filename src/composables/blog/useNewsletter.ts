import { ref } from 'vue'
import { getClient, withUserAuth } from '../../amplifyClient'
import type { Schema } from '../../../amplify/data/resource'
import { useApi } from '../useApi'

type Newsletter = Schema['Newsletter']['type']
type Token = Schema['NewsletterConfirmationToken']['type']

// Centralized newsletter management composable leveraging Amplify Data
export function useNewsletter() {
  const client = getClient()
  const { withErrorToast } = useApi()
  const subscribers = ref<Newsletter[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref('')
  const lastFetchedAt = ref<Date | null>(null)

  // pagination state (admin big list view)
  const nextToken = ref<string | null>(null)
  const pageSize = ref(50)

  async function fetchSubscribers(options?: { force?: boolean, page?: number, reset?: boolean }) {
    if (loading.value) return
    if (options?.reset) { subscribers.value = []; nextToken.value = null }
    if (!options?.force && subscribers.value.length && !options?.reset) return
    loading.value = true; error.value = null
    try {
      const result = await withErrorToast('Load Subscribers', () => client.models.Newsletter.list(withUserAuth({ limit: pageSize.value, nextToken: nextToken.value || undefined })))
      const data = (result as any).data || []
      if (nextToken.value && !options?.reset) subscribers.value = [...subscribers.value, ...data]
      else subscribers.value = data
      nextToken.value = (result as any).nextToken || null
      lastFetchedAt.value = new Date()
      return subscribers.value
    } catch (e: any) {
      error.value = e.message || 'Failed to load subscribers'
      return []
    } finally { loading.value = false }
  }

  async function subscribe(email: string, name?: string, frequency: Newsletter['frequency'] = 'WEEKLY', topics: string[] = []) {
    loading.value = true; error.value = null; successMessage.value = ''
    try {
      const { data } = await withErrorToast('Add Subscriber', () => client.models.Newsletter.create({
        email: email.toLowerCase().trim(),
        name,
        frequency,
        topics,
        isSubscribed: true,
        subscribedAt: new Date().toISOString(),
        status: 'ACTIVE'
      }, withUserAuth()))
      if (data) {
        subscribers.value = [data, ...subscribers.value.filter(s => s.email !== data.email)]
        successMessage.value = 'Subscriber added'
      }
      return !!data
    } catch (e: any) {
      error.value = e.message || 'Failed to subscribe'
      return false
    } finally { loading.value = false }
  }

  async function toggleSubscription(id: string, isSubscribed: boolean) {
    loading.value = true; error.value = null
    try {
      const { data } = await withErrorToast(isSubscribed ? 'Unsubscribe' : 'Resubscribe', () => client.models.Newsletter.update({
        id,
        isSubscribed: !isSubscribed,
        unsubscribedAt: !isSubscribed ? null : new Date().toISOString(),
        subscribedAt: !isSubscribed ? new Date().toISOString() : undefined,
        status: !isSubscribed ? 'ACTIVE' : 'UNSUBSCRIBED'
      }, withUserAuth()))
      if (data) {
        const idx = subscribers.value.findIndex(s => s.id === id)
        if (idx !== -1) subscribers.value[idx] = data
      }
      return !!data
    } catch (e: any) {
      error.value = e.message || 'Failed to toggle subscription'
      return false
    } finally { loading.value = false }
  }

  async function removeSubscriber(id: string) {
    loading.value = true; error.value = null
    const prev = [...subscribers.value]
    try {
      subscribers.value = subscribers.value.filter(s => s.id !== id)
      await withErrorToast('Delete Subscriber', () => client.models.Newsletter.delete({ id }, withUserAuth()))
      return true
    } catch (e: any) {
      subscribers.value = prev
      error.value = e.message || 'Failed to delete subscriber'
      return false
    } finally { loading.value = false }
  }

  function exportCsv() {
    const header = ['Email','Name','Subscribed','Frequency','Topics','SubscribedAt','UnsubscribedAt']
    const rows = subscribers.value.map(s => [
      s.email,
      s.name || '',
      s.isSubscribed ? 'yes' : 'no',
      s.frequency || '',
      (s.topics || []).join('|'),
      s.subscribedAt || '',
      s.unsubscribedAt || ''
    ])
    const csv = [header, ...rows].map(r => r.map(field => '"'+String(field).replace(/"/g,'""')+'"').join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `subscribers-${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function hasMore() { return !!nextToken.value }
  async function loadMore() { if (nextToken.value) await fetchSubscribers({ force: true }) }

  return {
    subscribers,
    loading,
    error,
    successMessage,
    lastFetchedAt,
    fetchSubscribers,
    subscribe,
    toggleSubscription,
    removeSubscriber,
    exportCsv,
    nextToken,
    pageSize,
    hasMore,
    loadMore
  }
}
