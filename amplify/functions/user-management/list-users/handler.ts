import type { APIGatewayProxyHandler } from 'aws-lambda'
import { logger } from '../../logger'
import { CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { getUserPoolId } from '../../getUserPoolId'

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
    logger.debug('List users OPTIONS preflight')
    return { statusCode: 200, headers, body: JSON.stringify({}) }
  }

  try {
    // Verify user is authenticated and has admin permissions
  const userPoolId = getUserPoolId(event)

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
  logger.debug('Fetched users page', { usersCount: (response.Users || []).length, hasMore: !!response.PaginationToken })
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
          logger.error('Error fetching user groups', { user: user.Username, error })
          return {
            ...user,
            Groups: []
          }
        }
      })
    )

    logger.info('List users success', { usersReturned: usersWithGroups.length })
    return { statusCode: 200, headers, body: JSON.stringify({ users: usersWithGroups, paginationToken: response.PaginationToken, total: users.length }) }

  } catch (error) {
    logger.error('Error listing users', { error })
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Failed to list users', message: error instanceof Error ? error.message : 'Unknown error' }) }
  }
}
