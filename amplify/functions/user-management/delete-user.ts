import type { APIGatewayProxyHandler } from 'aws-lambda'
import { CognitoIdentityProviderClient, AdminDeleteUserCommand } from '@aws-sdk/client-cognito-identity-provider'

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

    const username = event.pathParameters?.username
    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Username is required in path' })
      }
    }

    // Delete user
    const deleteCommand = new AdminDeleteUserCommand({
      UserPoolId: userPoolId,
      Username: username
    })

    await client.send(deleteCommand)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User deleted successfully',
        username: username
      })
    }

  } catch (error) {
    console.error('Error deleting user:', error)
    
    let statusCode = 500
    let errorMessage = 'Failed to delete user'
    
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        statusCode = 404
        errorMessage = 'User not found'
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
