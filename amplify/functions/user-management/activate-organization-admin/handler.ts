import type { APIGatewayProxyHandler } from 'aws-lambda'
import { logger } from '../../logger'
import { Amplify } from 'aws-amplify'
import { getAmplifyOutputs } from '../../../outputs'
import { generateClient } from 'aws-amplify/data'
import {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
  AdminGetUserCommand
} from '@aws-sdk/client-cognito-identity-provider'
import type { Schema } from '../../../../amplify/data/resource'
import { getUserPoolId } from '../../getUserPoolId'

Amplify.configure(getAmplifyOutputs())
const client = generateClient<Schema>()
const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

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
    logger.debug('Activation OPTIONS preflight')
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    if (!event.body) {
      logger.warn('Activate called with missing body', { requestId: event.requestContext.requestId })
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing body' }) }
    }
    const payload: ActivatePayload = JSON.parse(event.body)
    if (!payload.organizationId) {
      logger.warn('Activation missing organizationId')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'organizationId required' }) }
    }
    logger.info('Activation request received', { organizationId: payload.organizationId })
    const orgRes = await client.models.Organization.get({ id: payload.organizationId })
    const org = orgRes.data
    if (!org) {
      logger.warn('Activation org not found', { organizationId: payload.organizationId })
      return { statusCode: 404, headers, body: JSON.stringify({ error: 'Organization not found' }) }
    }

    if (org.status === 'ACTIVE') {
      logger.debug('Organization already active', { organizationId: org.id })
      return { statusCode: 200, headers, body: JSON.stringify({ message: 'Already active', organization: org }) }
    }

    const email = (payload.email || org.invitedAdminEmail || '').trim().toLowerCase()
    if (!email) {
      logger.warn('No invited admin email present for activation', { organizationId: org.id })
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'No invited admin email available to activate' }) }
    }

    const newAdmins = Array.from(new Set([...(org.admins || []), email]))

    // Add to Cognito client group if user exists; if not, we leave org ACTIVE but log warning
    try {
      try {
  const userPoolId = getUserPoolId(event)
        try {
          await cognito.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: email }))
          await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: email, GroupName: 'client' }))
          logger.debug('Added user to client group during activation', { email, organizationId: org.id })
        } catch (userErr: any) {
          logger.warn('User not found or client group add failed during activation; proceeding anyway', { email, error: userErr?.name || userErr?.message })
        }
      } catch (poolErr: any) {
        logger.warn('User pool id unavailable for activation group add; continuing activation', { error: poolErr?.message })
      }
    } catch (groupErr) {
      logger.error('Unexpected error adding user to client group during activation', { error: groupErr })
    }

    const now = new Date().toISOString()
    const updateRes = await client.models.Organization.update({
      id: org.id,
      admins: newAdmins,
      status: 'ACTIVE',
      activatedAt: org.activatedAt || now,
      activatedBy: org.activatedBy || email
    })
    logger.info('Organization activated', { organizationId: org.id, adminsCount: newAdmins.length })
    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Organization activated', organization: updateRes.data }) }
  } catch (err) {
    logger.error('Activation error', { error: err, requestId: event.requestContext.requestId })
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Activation failed' }) }
  }
}
