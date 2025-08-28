import type { APIGatewayProxyHandler } from 'aws-lambda'
import { CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
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

    // Parse query parameters for pagination
    const limit = event.queryStringParameters?.limit ? parseInt(event.queryStringParameters.limit) : 60
    const paginationToken = event.queryStringParameters?.paginationToken || undefined

    // List users
    const listCommand = new ListUsersCommand({
      UserPoolId: userPoolId,
      Limit: Math.min(limit, 60), // Cognito max limit is 60
      PaginationToken: paginationToken
    })

    const response = await client.send(listCommand)
    const users = response.Users || []

    // Get groups for each user
    const usersWithGroups = await Promise.all(
      users.map(async (user) => {
        try {
          const groupsCommand = new AdminListGroupsForUserCommand({
            UserPoolId: userPoolId,
            Username: user.Username!
          })
          const groupsResponse = await client.send(groupsCommand)
          return {
            ...user,
            Groups: groupsResponse.Groups?.map(g => g.GroupName) || []
          }
        } catch (error) {
          console.error(`Error fetching groups for user ${user.Username}:`, error)
          return {
            ...user,
            Groups: []
          }
        }
      })
    )

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        users: usersWithGroups,
        paginationToken: response.PaginationToken,
        total: users.length
      })
    }

  } catch (error) {
    console.error('Error listing users:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to list users',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}
