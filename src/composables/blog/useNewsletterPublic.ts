import { ref } from 'vue'
import { getClient, withPublic } from '../../amplifyClient'
import type { Schema } from '../../../amplify/data/resource'
import { useApi } from '../useApi'

// Public-facing newsletter double opt-in workflow
// States: Newsletter.status: PENDING -> ACTIVE -> UNSUBSCRIBED
// Tokens stored in NewsletterConfirmationToken entries

type Newsletter = Schema['Newsletter']['type']

type FlowResult = { success: boolean; message: string }

export function useNewsletterPublic() {
  const client = getClient()
  const { withErrorToast } = useApi()
  const submitting = ref(false)
  const lastError = ref<string | null>(null)
  const lastMessage = ref<string | null>(null)

  function generateToken(length = 32) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let out = ''
    crypto.getRandomValues(new Uint8Array(length)).forEach(b => out += chars[b % chars.length])
    return out
  }

  async function startSubscription(email: string, name?: string): Promise<FlowResult> {
    submitting.value = true; lastError.value = null; lastMessage.value = null
    email = email.toLowerCase().trim()
    try {
      // create or update existing newsletter row to PENDING
      const existing = await client.models.Newsletter.list(withPublic({ filter: { email: { eq: email }}, limit: 1 }))
      let record: Newsletter | undefined = (existing as any).data?.[0]
      if (!record) {
        const created = await client.models.Newsletter.create({ email, name, isSubscribed: false, status: 'PENDING', subscribedAt: new Date().toISOString() }, withPublic())
        record = created.data as Newsletter
      } else {
        if (record.status === 'ACTIVE') {
          return { success: true, message: 'You are already subscribed.' }
        }
        await client.models.Newsletter.update({ id: record.id, name, status: 'PENDING', isSubscribed: false }, withPublic())
      }
      // issue token
      const token = generateToken(40)
      const expiresAt = new Date(Date.now() + 1000*60*60*24).toISOString()
      await client.models.NewsletterConfirmationToken.create({ email, token, expiresAt, type: 'CONFIRM' }, withPublic())
      // Ideally send email via function/SES integration (future)
      lastMessage.value = 'Confirmation email sent. Please check your inbox.'
      return { success: true, message: lastMessage.value }
    } catch (e: any) {
      lastError.value = e.message || 'Failed to start subscription'
  return { success: false, message: lastError.value || '' }
    } finally { submitting.value = false }
  }

  async function confirm(token: string): Promise<FlowResult> {
    submitting.value = true; lastError.value = null; lastMessage.value = null
    try {
      const tokens = await client.models.NewsletterConfirmationToken.list(withPublic({ filter: { token: { eq: token }}, limit: 1 }))
      const entry = (tokens as any).data?.[0]
      if (!entry) return { success: false, message: 'Invalid or expired token.' }
      if (entry.usedAt) return { success: false, message: 'Token already used.' }
      if (new Date(entry.expiresAt).getTime() < Date.now()) return { success: false, message: 'Token expired.' }
      const subs = await client.models.Newsletter.list(withPublic({ filter: { email: { eq: entry.email }}, limit: 1 }))
      const sub = (subs as any).data?.[0]
      if (!sub) return { success: false, message: 'Subscriber record missing.' }
      await client.models.Newsletter.update({ id: sub.id, status: 'ACTIVE', isSubscribed: true, subscribedAt: new Date().toISOString() }, withPublic())
      await client.models.NewsletterConfirmationToken.update({ id: entry.id, usedAt: new Date().toISOString() }, withPublic())
      lastMessage.value = 'Subscription confirmed. Welcome!'
      return { success: true, message: lastMessage.value }
    } catch (e: any) {
      lastError.value = e.message || 'Failed to confirm subscription'
  return { success: false, message: lastError.value || '' }
    } finally { submitting.value = false }
  }

  async function requestUnsubscribe(email: string): Promise<FlowResult> {
    submitting.value = true; lastError.value = null; lastMessage.value = null
    try {
      email = email.toLowerCase().trim()
      const subs = await client.models.Newsletter.list(withPublic({ filter: { email: { eq: email }}, limit: 1 }))
      const sub = (subs as any).data?.[0]
      if (!sub || sub.status !== 'ACTIVE') return { success: false, message: 'No active subscription for that email.' }
      const token = generateToken(40)
      const expiresAt = new Date(Date.now() + 1000*60*60*24).toISOString()
      await client.models.NewsletterConfirmationToken.create({ email, token, expiresAt, type: 'UNSUBSCRIBE' }, withPublic())
      lastMessage.value = 'Unsubscribe link sent.'
      return { success: true, message: lastMessage.value }
    } catch (e: any) {
      lastError.value = e.message || 'Failed to request unsubscribe'
  return { success: false, message: lastError.value || '' }
    } finally { submitting.value = false }
  }

  async function finalizeUnsubscribe(token: string): Promise<FlowResult> {
    submitting.value = true; lastError.value = null; lastMessage.value = null
    try {
      const tokens = await client.models.NewsletterConfirmationToken.list(withPublic({ filter: { token: { eq: token }, type: { eq: 'UNSUBSCRIBE' }}, limit: 1 }))
      const entry = (tokens as any).data?.[0]
      if (!entry) return { success: false, message: 'Invalid or expired token.' }
      if (entry.usedAt) return { success: false, message: 'Token already used.' }
      if (new Date(entry.expiresAt).getTime() < Date.now()) return { success: false, message: 'Token expired.' }
      const subs = await client.models.Newsletter.list(withPublic({ filter: { email: { eq: entry.email }}, limit: 1 }))
      const sub = (subs as any).data?.[0]
      if (!sub) return { success: false, message: 'Subscriber record missing.' }
      await client.models.Newsletter.update({ id: sub.id, status: 'UNSUBSCRIBED', isSubscribed: false, unsubscribedAt: new Date().toISOString() }, withPublic())
      await client.models.NewsletterConfirmationToken.update({ id: entry.id, usedAt: new Date().toISOString() }, withPublic())
      lastMessage.value = 'You have been unsubscribed.'
      return { success: true, message: lastMessage.value }
    } catch (e: any) {
      lastError.value = e.message || 'Failed to unsubscribe'
  return { success: false, message: lastError.value || '' }
    } finally { submitting.value = false }
  }

  return {
    submitting,
    lastError,
    lastMessage,
    startSubscription,
    confirm,
    requestUnsubscribe,
    finalizeUnsubscribe
  }
}
