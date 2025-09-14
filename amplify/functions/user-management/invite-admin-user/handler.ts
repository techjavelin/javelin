import type { APIGatewayProxyHandler } from 'aws-lambda'
import { logger } from '../../logger'
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider'
import { getUserPoolId } from '../../getUserPoolId'

const cognito = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

interface InvitePayload {
  email: string
  organizationId: string
  organizationName?: string
  sendEmail?: boolean
  // future: role differentiation
}

export const handler: APIGatewayProxyHandler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  }

  if (event.httpMethod === 'OPTIONS') {
    logger.debug('OPTIONS preflight received')
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
  const userPoolId = getUserPoolId(event)

    if (!event.body) {
      logger.warn('Invite called with missing body', { requestId: event.requestContext.requestId })
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
    }

    const payload: InvitePayload = JSON.parse(event.body)
    if (!payload.email || !payload.organizationId) {
      logger.warn('Validation failed', { email: payload.email, organizationId: payload.organizationId })
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'email and organizationId are required' }) }
    }

  const email = payload.email.trim().toLowerCase()
  logger.info('Processing admin invite', { email, organizationId: payload.organizationId })

    // Attempt to create user (idempotent if already exists -> will catch and fallback to adding to group)
    let created = false
    try {
      const createCmd = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
          // store org id as custom attribute (must exist in pool schema if used) otherwise skip
        ],
        // Only specify SUPPRESS to skip email; omit RESEND for first-time create per Cognito API semantics
        ...(payload.sendEmail === false ? { MessageAction: MessageActionType.SUPPRESS } : {}),
        DesiredDeliveryMediums: ['EMAIL']
      })
      await cognito.send(createCmd)
      created = true
      logger.debug('User created in Cognito', { email })
    } catch (err: any) {
      if (err?.name !== 'UsernameExistsException') {
        logger.error('Create user error', { error: err, email })
        throw err
      }
      logger.debug('User already exists, proceeding', { email })
    }

    // Optionally attach/update attributes (organization context) - placeholder if custom attr added later
    if (payload.organizationName) {
      try {
        const updateCmd = new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: email,
          UserAttributes: [
            { Name: 'custom:org_last_invited', Value: payload.organizationId }
          ]
        })
        await cognito.send(updateCmd)
        logger.debug('Updated optional attributes', { email, organizationId: payload.organizationId })
      } catch (err) {
        // swallow if custom attribute not defined yet
        logger.warn('Optional attribute update failed (likely attribute not defined)', { error: err, email })
      }
    }

  const responseBody = { message: 'User invited (no group assignment until activation adds client role)', email, created, organizationId: payload.organizationId }
    logger.info('Invite admin success', responseBody)
    return { statusCode: 200, headers, body: JSON.stringify(responseBody) }
  } catch (error) {
    logger.error('Invite admin user failure', { error, requestId: event.requestContext.requestId })
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to invite admin user' }) }
  }
}
