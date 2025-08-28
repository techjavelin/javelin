import type { APIGatewayProxyHandler } from 'aws-lambda'
import { 
  CognitoIdentityProviderClient, 
  AdminUpdateUserAttributesCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand
} from '@aws-sdk/client-cognito-identity-provider'

const client = new CognitoIdentityProviderClient({ region: process.env.AWS_REGION })

export const handler: APIGatewayProxyHandler = async (event) => {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'PUT,OPTIONS',
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

    if (!event.body) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Request body is required' })
      }
    }

    const { givenName, familyName, enabled, groups = [] } = JSON.parse(event.body)

    // Update user attributes if provided
    if (givenName !== undefined || familyName !== undefined) {
      const userAttributes = []
      
      if (givenName !== undefined) {
        userAttributes.push({ Name: 'given_name', Value: givenName })
      }
      
      if (familyName !== undefined) {
        userAttributes.push({ Name: 'family_name', Value: familyName })
      }

      if (userAttributes.length > 0) {
        const updateCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: username,
          UserAttributes: userAttributes
        })
        await client.send(updateCommand)
      }
    }

    // Update user enabled/disabled status
    if (enabled !== undefined) {
      const statusCommand = enabled 
        ? new AdminEnableUserCommand({
            UserPoolId: userPoolId,
            Username: username
          })
        : new AdminDisableUserCommand({
            UserPoolId: userPoolId,
            Username: username
          })
      
      await client.send(statusCommand)
    }

    // Update user groups
    if (groups.length >= 0) {
      // Get current groups
      const currentGroupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: userPoolId,
        Username: username
      })
      
      const currentGroupsResponse = await client.send(currentGroupsCommand)
      const currentGroups = currentGroupsResponse.Groups?.map(g => g.GroupName) || []

      // Remove from groups no longer selected
      for (const group of currentGroups) {
        if (!groups.includes(group)) {
          try {
            const removeCommand = new AdminRemoveUserFromGroupCommand({
              UserPoolId: userPoolId,
              Username: username,
              GroupName: group
            })
            await client.send(removeCommand)
          } catch (error) {
            console.error(`Error removing user from group ${group}:`, error)
          }
        }
      }

      // Add to new groups
      for (const group of groups) {
        if (!currentGroups.includes(group)) {
          try {
            const addCommand = new AdminAddUserToGroupCommand({
              UserPoolId: userPoolId,
              Username: username,
              GroupName: group
            })
            await client.send(addCommand)
          } catch (error) {
            console.error(`Error adding user to group ${group}:`, error)
          }
        }
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'User updated successfully',
        username: username
      })
    }

  } catch (error) {
    console.error('Error updating user:', error)
    
    let statusCode = 500
    let errorMessage = 'Failed to update user'
    
    if (error instanceof Error) {
      if (error.name === 'UserNotFoundException') {
        statusCode = 404
        errorMessage = 'User not found'
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
