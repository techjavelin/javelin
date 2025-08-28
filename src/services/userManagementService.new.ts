import { fetchAuthSession } from 'aws-amplify/auth'
import { 
  CognitoIdentityProviderClient,
  ListUsersCommand,
  AdminCreateUserCommand,
  AdminUpdateUserAttributesCommand,
  AdminEnableUserCommand,
  AdminDisableUserCommand,
  AdminDeleteUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  AdminListGroupsForUserCommand,
  MessageActionType,
  type CognitoIdentityProviderClientConfig
} from '@aws-sdk/client-cognito-identity-provider'

// Types
export interface User {
  username: string
  email: string
  userStatus: string
  enabled: boolean
  userCreateDate: string
  userLastModifiedDate?: string
  attributes: Array<{ name: string; value: string }>
  groups?: string[]
}

export interface CreateUserData {
  email: string
  givenName?: string
  familyName?: string
  groups?: string[]
  temporaryPassword?: string
  sendWelcomeEmail?: boolean
}

export interface UpdateUserData {
  givenName?: string
  familyName?: string
  enabled?: boolean
  groups?: string[]
}

// Get Cognito client with proper authentication
async function getCognitoClient(): Promise<{ client: CognitoIdentityProviderClient; userPoolId: string }> {
  const session = await fetchAuthSession()
  
  if (!session.credentials) {
    throw new Error('No authenticated session found')
  }

  const config: CognitoIdentityProviderClientConfig = {
    region: session.credentials.sessionToken ? 'us-east-1' : process.env.AWS_REGION || 'us-east-1', // Replace with your region
    credentials: session.credentials
  }

  const client = new CognitoIdentityProviderClient(config)
  
  // Get user pool ID from amplify_outputs or environment
  const userPoolId = process.env.VITE_USER_POOL_ID || 'your-user-pool-id' // You'll need to set this
  
  return { client, userPoolId }
}

// Generate secure temporary password
function generateTemporaryPassword(): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const specials = '!@#$%^&*'
  const allChars = uppercase + lowercase + numbers + specials
  
  let password = ''
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length))
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length))
  password += numbers.charAt(Math.floor(Math.random() * numbers.length))
  password += specials.charAt(Math.floor(Math.random() * specials.length))
  
  for (let i = 4; i < 16; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length))
  }
  
  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// Helper functions
export function getUserAttribute(user: User, attributeName: string): string {
  const attr = user.attributes?.find(attr => attr.name === attributeName)
  return attr?.value || ''
}

export function getUserDisplayName(user: User): string {
  const givenName = getUserAttribute(user, 'given_name')
  const familyName = getUserAttribute(user, 'family_name')
  
  if (givenName && familyName) {
    return `${givenName} ${familyName}`
  } else if (givenName) {
    return givenName
  } else if (familyName) {
    return familyName
  } else {
    return user.email || user.username || 'Unknown'
  }
}

export function getUserEmail(user: User): string {
  return getUserAttribute(user, 'email') || user.email || user.username || ''
}

// Transform Cognito user to our User type
function transformCognitoUser(cognitoUser: any): User {
  return {
    username: cognitoUser.Username,
    email: cognitoUser.Attributes?.find((attr: any) => attr.Name === 'email')?.Value || cognitoUser.Username,
    userStatus: cognitoUser.UserStatus,
    enabled: cognitoUser.Enabled !== false,
    userCreateDate: cognitoUser.UserCreateDate,
    userLastModifiedDate: cognitoUser.UserLastModifiedDate,
    attributes: cognitoUser.Attributes?.map((attr: any) => ({
      name: attr.Name,
      value: attr.Value
    })) || [],
    groups: [] // Will be populated separately
  }
}

// Service methods
export const userManagementService = {
  async listUsers(limit: number = 60): Promise<{ users: User[] }> {
    try {
      const { client, userPoolId } = await getCognitoClient()
      
      const command = new ListUsersCommand({
        UserPoolId: userPoolId,
        Limit: limit
      })
      
      const response = await client.send(command)
      
      if (!response.Users) {
        return { users: [] }
      }
      
      const users = response.Users.map(transformCognitoUser)
      
      // Load groups for each user
      for (const user of users) {
        try {
          const groupsCommand = new AdminListGroupsForUserCommand({
            UserPoolId: userPoolId,
            Username: user.username
          })
          const groupsResponse = await client.send(groupsCommand)
          user.groups = groupsResponse.Groups?.map(group => group.GroupName || '') || []
        } catch (error) {
          console.warn(`Failed to load groups for user ${user.username}:`, error)
          user.groups = []
        }
      }
      
      return { users }
    } catch (error) {
      console.error('Error listing users:', error)
      throw new Error(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async createUser(userData: CreateUserData): Promise<{ user: User; temporaryPassword?: string }> {
    try {
      const { client, userPoolId } = await getCognitoClient()
      const { email, givenName, familyName, groups = [], temporaryPassword, sendWelcomeEmail = true } = userData
      
      const finalTemporaryPassword = temporaryPassword || generateTemporaryPassword()
      
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
      
      const command = new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: userAttributes,
        TemporaryPassword: finalTemporaryPassword,
        MessageAction: sendWelcomeEmail ? MessageActionType.RESEND : MessageActionType.SUPPRESS,
        DesiredDeliveryMediums: ['EMAIL']
      })
      
      const response = await client.send(command)
      
      // Add user to groups
      for (const groupName of groups) {
        try {
          const addToGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: email,
            GroupName: groupName
          })
          await client.send(addToGroupCommand)
        } catch (error) {
          console.warn(`Failed to add user to group ${groupName}:`, error)
        }
      }
      
      const user = transformCognitoUser(response.User)
      user.groups = groups
      
      return { user, temporaryPassword: finalTemporaryPassword }
    } catch (error) {
      console.error('Error creating user:', error)
      throw new Error(`Failed to create user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async updateUser(username: string, userData: UpdateUserData): Promise<{ user: User }> {
    try {
      const { client, userPoolId } = await getCognitoClient()
      const { givenName, familyName, enabled, groups = [] } = userData
      
      // Update user attributes
      const attributesToUpdate = []
      if (givenName !== undefined) {
        attributesToUpdate.push({ Name: 'given_name', Value: givenName })
      }
      if (familyName !== undefined) {
        attributesToUpdate.push({ Name: 'family_name', Value: familyName })
      }
      
      if (attributesToUpdate.length > 0) {
        const updateCommand = new AdminUpdateUserAttributesCommand({
          UserPoolId: userPoolId,
          Username: username,
          UserAttributes: attributesToUpdate
        })
        await client.send(updateCommand)
      }
      
      // Update enabled status
      if (enabled !== undefined) {
        if (enabled) {
          const enableCommand = new AdminEnableUserCommand({
            UserPoolId: userPoolId,
            Username: username
          })
          await client.send(enableCommand)
        } else {
          const disableCommand = new AdminDisableUserCommand({
            UserPoolId: userPoolId,
            Username: username
          })
          await client.send(disableCommand)
        }
      }
      
      // Update groups - get current groups first
      let currentGroups: string[] = []
      try {
        const currentGroupsCommand = new AdminListGroupsForUserCommand({
          UserPoolId: userPoolId,
          Username: username
        })
        const currentGroupsResponse = await client.send(currentGroupsCommand)
        currentGroups = currentGroupsResponse.Groups?.map(group => group.GroupName || '') || []
      } catch (error) {
        console.warn('Failed to get current groups:', error)
      }
      
      // Remove from groups no longer selected
      for (const group of currentGroups) {
        if (!groups.includes(group)) {
          try {
            const removeFromGroupCommand = new AdminRemoveUserFromGroupCommand({
              UserPoolId: userPoolId,
              Username: username,
              GroupName: group
            })
            await client.send(removeFromGroupCommand)
          } catch (error) {
            console.warn(`Failed to remove user from group ${group}:`, error)
          }
        }
      }
      
      // Add to new groups
      for (const group of groups) {
        if (!currentGroups.includes(group)) {
          try {
            const addToGroupCommand = new AdminAddUserToGroupCommand({
              UserPoolId: userPoolId,
              Username: username,
              GroupName: group
            })
            await client.send(addToGroupCommand)
          } catch (error) {
            console.warn(`Failed to add user to group ${group}:`, error)
          }
        }
      }
      
      // Get updated user
      const listCommand = new ListUsersCommand({
        UserPoolId: userPoolId,
        Filter: `username = "${username}"`
      })
      const listResponse = await client.send(listCommand)
      
      if (!listResponse.Users || listResponse.Users.length === 0) {
        throw new Error('User not found after update')
      }
      
      const user = transformCognitoUser(listResponse.Users[0])
      user.groups = groups
      
      return { user }
    } catch (error) {
      console.error('Error updating user:', error)
      throw new Error(`Failed to update user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async deleteUser(username: string): Promise<{ message: string }> {
    try {
      const { client, userPoolId } = await getCognitoClient()
      
      const command = new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: username
      })
      
      await client.send(command)
      
      return { message: 'User deleted successfully' }
    } catch (error) {
      console.error('Error deleting user:', error)
      throw new Error(`Failed to delete user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  },

  async resetUserPassword(username: string, temporaryPassword?: string): Promise<{ temporaryPassword: string; note: string }> {
    try {
      const { client, userPoolId } = await getCognitoClient()
      
      const finalTemporaryPassword = temporaryPassword || generateTemporaryPassword()
      
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: username,
        Password: finalTemporaryPassword,
        Permanent: false
      })
      
      await client.send(command)
      
      return {
        temporaryPassword: finalTemporaryPassword,
        note: 'User will be required to change password on next login'
      }
    } catch (error) {
      console.error('Error resetting password:', error)
      throw new Error(`Failed to reset password: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
