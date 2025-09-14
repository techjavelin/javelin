// Service for Pulse Platform admin org invitation logic
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'
import { inviteUserByEmail } from './cognitoInvite'

// Backend logic: invite user, then create org after confirmation
export async function inviteOrganization(orgName: string, primaryEmail: string) {
  const client = generateClient<Schema>()
  // 1. Create the user in Cognito and get their sub (userId)
  const userId = await inviteUserByEmail(primaryEmail)

  // 2. (Optional: Wait for user confirmation if needed)

  // 3. Create organization with confirmed user as admin
  const org = await client.models.Organization.create({
    name: orgName,
    admins: [userId],
    members: [userId],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }, { authMode: 'userPool' })

  if (org.errors && org.errors.length > 0) throw new Error(org.errors[0].message)
  if (!org.data) throw new Error('Organization creation failed')
  return org.data
}
