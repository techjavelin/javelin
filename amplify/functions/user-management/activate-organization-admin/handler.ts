import type { APIGatewayProxyHandler } from 'aws-lambda'
import { Amplify } from 'aws-amplify'
import outputs from '../../../../amplify_outputs.json'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../../../amplify/data/resource'

Amplify.configure(outputs)
const client = generateClient<Schema>()

interface ActivatePayload {
  organizationId: string
  // optional override email if needed
  email?: string
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    if (!event.body) return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
    const payload: ActivatePayload = JSON.parse(event.body)
    if (!payload.organizationId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId required' }) }
    }

    const orgRes = await client.models.Organization.get({ id: payload.organizationId })
    const org = orgRes.data
    if (!org) return { statusCode: 404, headers, body: JSON.stringify({ error: 'Organization not found' }) }

    if (org.status === 'ACTIVE') {
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Already active', organization: org }) }
    }

    const email = (payload.email || org.invitedAdminEmail || '').trim().toLowerCase()
    if (!email) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No invited admin email available to activate' }) }
    }

    const newAdmins = Array.from(new Set([...(org.admins || []), email]))

    const updateRes = await client.models.Organization.update({
      id: org.id,
      admins: newAdmins,
      status: 'ACTIVE'
    })

    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Organization activated', organization: updateRes.data }) }
  } catch (err) {
    console.error('Activation error', err)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Activation failed' }) }
  }
}
