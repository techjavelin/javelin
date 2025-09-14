import type { APIGatewayProxyHandler } from 'aws-lambda'
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminAddUserToGroupCommand,
  AdminUpdateUserAttributesCommand,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider'

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
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    const userPoolId = process.env.AMPLIFY_AUTH_USER_POOL_ID
    if (!userPoolId) throw new Error('User Pool ID not configured')

    if (!event.body) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing request body' }) }
    }

    const payload: InvitePayload = JSON.parse(event.body)
    if (!payload.email || !payload.organizationId) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'email and organizationId are required' }) }
    }

    const email = payload.email.trim().toLowerCase()

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
        MessageAction: payload.sendEmail === false ? MessageActionType.SUPPRESS : MessageActionType.RESEND,
        DesiredDeliveryMediums: ['EMAIL']
      })
      await cognito.send(createCmd)
      created = true
    } catch (err: any) {
      if (err?.name !== 'UsernameExistsException') {
        console.error('Create user error', err)
        throw err
      }
    }

    // Add to admin group
    try {
      const addCmd = new AdminAddUserToGroupCommand({
        UserPoolId: userPoolId,
        Username: email,
        GroupName: 'admin'
      })
      await cognito.send(addCmd)
    } catch (err) {
      console.error('Add to admin group error', err)
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
      } catch (err) {
        // swallow if custom attribute not defined yet
        console.warn('Optional attribute update failed (likely attribute not defined)', err as any)
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Admin user invited',
        email,
        created,
        organizationId: payload.organizationId
      })
    }
  } catch (error) {
    console.error('Invite admin user failure', error)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to invite admin user' }) }
  }
}
