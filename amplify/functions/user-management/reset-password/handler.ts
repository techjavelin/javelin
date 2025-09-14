import type { APIGatewayProxyHandler } from 'aws-lambda'
import { logger } from '../../logger'
import { CognitoIdentityProviderClient, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider'
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
    logger.debug('Reset password OPTIONS preflight')
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    // Resolve user pool id centrally (event-aware)
    const userPoolId = getUserPoolId(event)

    const username = event.pathParameters?.username
    if (!username) {
      logger.warn('Reset password missing username param')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username is required in path' }) }
    }

    // Parse body to get temporary password or generate one
    let temporaryPassword: string
    
    if (event.body) {
      const body = JSON.parse(event.body)
      temporaryPassword = body.temporaryPassword || generateTemporaryPassword()
    } else {
      temporaryPassword = generateTemporaryPassword()
    }

    // Reset password
    const resetCommand = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: temporaryPassword,
      Permanent: false // This will force user to change password on next login
    })

  await client.send(resetCommand)
  logger.info('Password reset issued', { username })

    return { statusCode: 200, headers, body: JSON.stringify({ message: 'Password reset successfully', username, temporaryPassword, note: 'User will be required to change password on next login' }) }

  } catch (error) {
    logger.error('Error resetting password', { error })
    
    let statusCode = 500
    let errorMessage = 'Failed to reset password'
    
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        statusCode = 404
        errorMessage = 'User not found'
      } else if (error.name === 'InvalidParameterException') {
        statusCode = 400
        errorMessage = 'Invalid parameters provided'
      }
    }

    return { statusCode, headers, body: JSON.stringify({ error: errorMessage, message: error instanceof Error ? error.message : 'Unknown error' }) }
  }
}
