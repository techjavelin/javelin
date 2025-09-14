import type { APIGatewayProxyHandler } from 'aws-lambda'
import { logger } from '../../logger'
import { 
  CognitoIdentityProviderClient, 
  AdminCreateUserCommand, 
  AdminAddUserToGroupCommand,
  MessageActionType
} from '@aws-sdk/client-cognito-identity-provider'
import { getUserPoolId } from '../../getUserPoolId'

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

function generateTemporaryPassword(): string {
  // Character sets
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specials = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + specials
  
  // Ensure at least one character from each category
  let password = ''
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += specials.charAt(Math.floor(Math.random() * specials.length))
  
  // Fill remaining 12 characters randomly
  for (let i = 4; i < 16; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  // Shuffle the password to randomize the position of guaranteed characters
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

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
    logger.debug('Create user OPTIONS preflight')
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    // Resolve user pool id centrally
    const userPoolId = getUserPoolId()

    if (!event.body) {
      logger.warn('Create user missing body')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Request body is required' }) }
    }

    const { email, givenName, familyName, groups = [], temporaryPassword, sendWelcomeEmail = true } = JSON.parse(event.body)

    if (!email) {
      logger.warn('Create user missing email')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Email is required' }) }
    }

    // Generate temporary password if not provided
    const finalTemporaryPassword = temporaryPassword || generateTemporaryPassword()

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
      TemporaryPassword: finalTemporaryPassword,
      // Only set SUPPRESS to skip initial email; omit RESEND for initial create
      ...(sendWelcomeEmail ? {} : { MessageAction: MessageActionType.SUPPRESS }),
      DesiredDeliveryMediums: ['EMAIL']
    })

  const response = await client.send(createCommand)
  logger.info('User created in Cognito', { email })

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
          logger.error('Error adding user to group', { groupName, error, email })
        }
      }
    }

    logger.info('Create user success', { email, groupsCount: groups.length })
    return { statusCode: 201, headers, body: JSON.stringify({ message: 'User created successfully', user: response.User, groups, temporaryPassword: finalTemporaryPassword }) }

  } catch (error) {
    logger.error('Error creating user', { error })
    
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

    return { statusCode, headers, body: JSON.stringify({ error: errorMessage, message: error instanceof Error ? error.message : 'Unknown error' }) }
  }
}
