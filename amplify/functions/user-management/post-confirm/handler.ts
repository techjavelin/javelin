import type { PostConfirmationTriggerHandler } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import outputs from '../../../../amplify_outputs.json'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../../amplify/data/resource'

Amplify.configure(outputs)
const client = generateClient<Schema>()

// Strategy: find first PENDING organization whose invitedAdminEmail matches confirmed user's email and activate.
export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    const email = (event.request.userAttributes.email || '').trim().toLowerCase()
    if (!email) return event

    // List organizations (limit reasonably high). In future, add index or query optimization.
    const orgs = await client.models.Organization.list({ limit: 200 })
    const pending = (orgs.data || []).filter(o => o.status === 'PENDING' && (o.invitedAdminEmail || '').toLowerCase() === email)
    if (!pending.length) return event

    const target = pending[0] // first match strategy

    const newAdmins = Array.from(new Set([...(target.admins || []), email]))
    await client.models.Organization.update({
      id: target.id,
      admins: newAdmins,
      status: 'ACTIVE',
      activatedAt: new Date().toISOString(),
      activatedBy: email
    })
  } catch (err) {
    console.error('PostConfirm activation failed', err)
  }
  return event
}
