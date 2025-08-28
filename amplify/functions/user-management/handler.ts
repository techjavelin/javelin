import type { APIGatewayProxyHandler } from 'aws-lambda'
import { 
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  AdminGetUserCommand,
  MessageActionType,
  type UserType
} from '@aws-sdk/client-cognito-identity-provider'

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
})

const USER_POOL_ID = process.env.AMPLIFY_AUTH_USERPOOL_ID

interface UserManagementRequest {
  action: 'listUsers' | 'createUser' | 'updateUser' | 'deleteUser' | 'resetPassword' | 'toggleUserStatus' | 'updateUserGroups'
  data?: any
}

export const handler: APIGatewayProxyHandler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET, PUT, DELETE',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'OK' })
    }
  }

  try {
    // Parse the request
    let body: UserManagementRequest
    try {
      body = JSON.parse(event.body || '{}')
    } catch (error) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid JSON in request body' })
      }
    }

    const { action, data } = body

    if (!USER_POOL_ID) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'User Pool ID not configured' })
      }
    }

    // Handle different actions
    switch (action) {
      case 'listUsers':
        return await listUsers()

      case 'createUser':
        return await createUser(data)

      case 'updateUser':
        return await updateUser(data)

      case 'deleteUser':
        return await deleteUser(data.username)

      case 'resetPassword':
        return await resetUserPassword(data.username, data.tempPassword)

      case 'toggleUserStatus':
        return await toggleUserStatus(data.username, data.enabled)

      case 'updateUserGroups':
        return await updateUserGroups(data.username, data.groups)

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }
  } catch (error) {
    console.error('Error in user management function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    }
  }

  // Helper functions
  async function listUsers() {
    try {
      const command = new ListUsersCommand({
        UserPoolId: USER_POOL_ID,
        Limit: 60
      })

      const response = await cognitoClient.send(command)
      const users = response.Users || []

      // Get groups for each user
      const usersWithGroups = await Promise.all(
        users.map(async (user) => {
          try {
            const groupsCommand = new AdminListGroupsForUserCommand({
              UserPoolId: USER_POOL_ID,
              Username: user.Username!
            })
            const groupsResponse = await cognitoClient.send(groupsCommand)
            return {
              ...user,
              Groups: groupsResponse.Groups?.map(g => g.GroupName) || []
            }
          } catch (error) {
            console.error(`Error getting groups for user ${user.Username}:`, error)
            return { ...user, Groups: [] }
          }
        })
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ users: usersWithGroups })
      }
    } catch (error) {
      console.error('Error listing users:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to list users' })
      }
    }
  }

  async function createUser(userData: {
    email: string
    givenName?: string
    familyName?: string
    groups?: string[]
    message?: string
    tempPassword?: string
  }) {
    try {
      const { email, givenName, familyName, groups = [], tempPassword } = userData

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

      const createCommand = new AdminCreateUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: tempPassword || generateTempPassword(),
        // MessageAction: MessageActionType.SUPPRESS // Don't send welcome email by default
      })

      const response = await cognitoClient.send(createCommand)

      // Add user to groups
      for (const group of groups) {
        try {
          await cognitoClient.send(new AdminAddUserToGroupCommand({
            UserPoolId: USER_POOL_ID,
            Username: email,
            GroupName: group
          }))
        } catch (error) {
          console.error(`Failed to add user to group ${group}:`, error)
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'User created successfully',
          user: response.User
        })
      }
    } catch (error) {
      console.error('Error creating user:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to create user' })
      }
    }
  }

  async function updateUser(userData: {
    username: string
    givenName?: string
    familyName?: string
    enabled?: boolean
  }) {
    try {
      const { username, givenName, familyName, enabled } = userData

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
          await cognitoClient.send(new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: username,
            UserAttributes: userAttributes
          }))
        }
      }

      // Update enabled status if provided
      if (enabled !== undefined) {
        const statusCommand = enabled 
          ? new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
          : new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
        
        await cognitoClient.send(statusCommand)
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'User updated successfully' })
      }
    } catch (error) {
      console.error('Error updating user:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update user' })
      }
    }
  }

  async function deleteUser(username: string) {
    try {
      await cognitoClient.send(new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username
      }))

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'User deleted successfully' })
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to delete user' })
      }
    }
  }

  async function resetUserPassword(username: string, tempPassword?: string) {
    try {
      const password = tempPassword || generateTempPassword()

      await cognitoClient.send(new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: password,
        Permanent: false // User must change on next login
      }))

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'Password reset successfully',
          tempPassword: password
        })
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to reset password' })
      }
    }
  }

  async function toggleUserStatus(username: string, enabled: boolean) {
    try {
      const command = enabled 
        ? new AdminEnableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
        : new AdminDisableUserCommand({ UserPoolId: USER_POOL_ID, Username: username })
      
      await cognitoClient.send(command)

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: `User ${enabled ? 'enabled' : 'disabled'} successfully`
        })
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update user status' })
      }
    }
  }

  async function updateUserGroups(username: string, newGroups: string[]) {
    try {
      // Get current groups
      const currentGroupsCommand = new AdminListGroupsForUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username
      })
      const currentGroupsResponse = await cognitoClient.send(currentGroupsCommand)
      const currentGroups = currentGroupsResponse.Groups?.map(g => g.GroupName!) || []

      // Remove from groups no longer selected
      for (const group of currentGroups) {
        if (!newGroups.includes(group)) {
          try {
            await cognitoClient.send(new AdminRemoveUserFromGroupCommand({
              UserPoolId: USER_POOL_ID,
              Username: username,
              GroupName: group
            }))
          } catch (error) {
            console.error(`Failed to remove user from group ${group}:`, error)
          }
        }
      }

      // Add to new groups
      for (const group of newGroups) {
        if (!currentGroups.includes(group)) {
          try {
            await cognitoClient.send(new AdminAddUserToGroupCommand({
              UserPoolId: USER_POOL_ID,
              Username: username,
              GroupName: group
            }))
          } catch (error) {
            console.error(`Failed to add user to group ${group}:`, error)
          }
        }
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'User groups updated successfully' })
      }
    } catch (error) {
      console.error('Error updating user groups:', error)
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Failed to update user groups' })
      }
    }
  }

  function generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return password
  }
}
