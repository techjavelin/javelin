import type { APIGatewayProxyHandler } from 'aws-lambda'
import { logger } from '../../logger'
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { getUserPoolId } from '../../getUserPoolId'

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'DELETE,OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    logger.debug('Delete user OPTIONS preflight')
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    // Resolve user pool id centrally (event-aware)
    const userPoolId = getUserPoolId(event)

    const username = event.pathParameters?.username
    if (!username) {
      logger.warn('Delete user missing username param')
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Username is required in path' }) }
    }

    // Delete user
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username
    })

  await client.send(deleteCommand)
  logger.info('User deleted', { username })

    return { statusCode: 200, headers, body: JSON.stringify({ message: 'User deleted successfully', username }) }

  } catch (error) {
    logger.error('Error deleting user', { error })
    
    let statusCode = 500
    let errorMessage = 'Failed to delete user'
    
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        statusCode = 404
        errorMessage = 'User not found'
      }
    }

    return { statusCode, headers, body: JSON.stringify({ error: errorMessage, message: error instanceof Error ? error.message : 'Unknown error' }) }
  }
}
