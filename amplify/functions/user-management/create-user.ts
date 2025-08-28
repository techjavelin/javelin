import type { APIGatewayProxyHandler } from 'aws-lambda'
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminAddUserToGroupCommand,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({})
    }
  }

  try {
    // Verify user is authenticated and has admin permissions
    const userPoolId = process.env.AMPLIFY_AUTH_USER_POOL_ID
    if (!userPoolId) {
      throw new Error('User Pool ID not configured')
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      }
    }

    const { email, givenName, familyName, groups = [], temporaryPassword, sendWelcomeEmail = true } = JSON.parse(event.body)

    if (!email) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Email is required' })
      }
    }

    // Prepare user attributes
    const userAttributes = [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' }
    ]

    if (givenName) {
      userAttributes.push({ Name: 'given_name', Value: givenName })
    }

    if (familyName) {
      userAttributes.push({ Name: 'family_name', Value: familyName })
    }

    // Create user
    const createCommand = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: userAttributes,
      TemporaryPassword: temporaryPassword,
      MessageAction: sendWelcomeEmail ? MessageActionType.RESEND : MessageActionType.SUPPRESS,
      DesiredDeliveryMediums: ['EMAIL']
    })

    const response = await client.send(createCommand)

    // Add user to groups
    if (groups.length > 0) {
      for (const groupName of groups) {
        try {
          const addToGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: email,
            GroupName: groupName
          })
          await client.send(addToGroupCommand)
        } catch (error) {
          console.error(`Error adding user to group ${groupName}:`, error)
        }
      }
    }

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User created successfully',
        user: response.User,
        groups: groups
      })
    }

  } catch (error) {
    console.error('Error creating user:', error)
    
    // Handle specific Cognito errors
    let statusCode = 500
    let errorMessage = 'Failed to create user'
    
    if (error instanceof Error) {
      if (error.name === 'UsernameExistsException') {
        statusCode = 409
        errorMessage = 'User already exists'
      } else if (error.name === 'InvalidParameterException') {
        statusCode = 400
        errorMessage = 'Invalid parameters provided'
      }
    }

    return {
      statusCode,
      headers,
      body: JSON.stringify({
        error: errorMessage,
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
