import { generateClient } from 'aws-amplify/data'
import type { Schema } from '@/../amplify/data/resource'
import { authorizationGuards, AuthorizationError } from './authorizationGuards'

const client = generateClient<Schema>()

export interface AssignAppRoleInput {
  applicationId: string
  organizationId: string
  userId: string
  role: 'APP_ADMIN' | 'APP_CONTRIBUTOR' | 'APP_READ_ONLY'
  grantedBy: string
}

export interface AssignEngagementRoleInput {
  engagementId: string
  applicationId: string
  organizationId: string
  userId: string
  role: 'ENG_PENTESTER' | 'ENG_CLIENT_ADMIN' | 'ENG_COLLABORATOR' | 'ENG_READ_ONLY'
  grantedBy: string
}

export async function assignApplicationRole(input: AssignAppRoleInput) {
  const { applicationId, organizationId, userId, role, grantedBy } = input
  await authorizationGuards.ensureOrgMembership(organizationId, userId)
  if (role === 'APP_ADMIN') {
    await authorizationGuards.validateAppAdminGrant(applicationId, organizationId, userId)
  }
  const existing = await client.models.ApplicationRoleAssignment.get({ applicationId, userId })
  if (existing.data) {
    const row: any = (existing as any).data
    // Update if role differs
    if (row.role !== role) {
      // Prevent downgrading last admin
      if (row.role === 'APP_ADMIN' && role !== 'APP_ADMIN') {
        await authorizationGuards.preventSoleAdminDowngrade('app', applicationId, userId)
      }
      const update = await client.models.ApplicationRoleAssignment.update({ applicationId, userId, role })
      return update.data
    }
    return row
  }
  const created = await client.models.ApplicationRoleAssignment.create({ applicationId, organizationId, userId, role, grantedBy })
  return created.data
}

export async function removeApplicationRole(applicationId: string, userId: string) {
  const existing = await client.models.ApplicationRoleAssignment.get({ applicationId, userId })
  if (!existing.data) return false
  const row: any = (existing as any).data
  if (row.role === 'APP_ADMIN') {
    await authorizationGuards.preventSoleAdminDowngrade('app', applicationId, userId)
  }
  await client.models.ApplicationRoleAssignment.delete({ applicationId, userId })
  return true
}

export async function assignEngagementRole(input: AssignEngagementRoleInput) {
  const { engagementId, applicationId, organizationId, userId, role, grantedBy } = input
  await authorizationGuards.validateEngagementAssignment(engagementId, applicationId, organizationId, userId)
  const existing = await client.models.EngagementRoleAssignment.get({ engagementId, userId })
  if (existing.data) {
    const row: any = (existing as any).data
    if (row.role !== role) {
      const update = await client.models.EngagementRoleAssignment.update({ engagementId, userId, role })
      return update.data
    }
    return row
  }
  const created = await client.models.EngagementRoleAssignment.create({ engagementId, applicationId, organizationId, userId, role, grantedBy })
  return created.data
}

export async function removeEngagementRole(engagementId: string, userId: string) {
  const existing = await client.models.EngagementRoleAssignment.get({ engagementId, userId })
  if (!existing.data) return false
  await client.models.EngagementRoleAssignment.delete({ engagementId, userId })
  return true
}

export function isAuthorizationError(e: unknown): e is AuthorizationError {
  return e instanceof AuthorizationError
}
