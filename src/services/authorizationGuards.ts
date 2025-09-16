import { generateClient } from 'aws-amplify/data'
import { withAuth } from '../amplifyClient'
import type { Schema } from '@/../amplify/data/resource'

const client = generateClient<Schema>()

export class AuthorizationError extends Error {
  constructor(message: string, public code: string = 'AUTHZ_INVARIANT_FAILED') { super(message) }
}

/**
 * Guard helpers centralize invariant enforcement prior to creating/updating
 * role assignment or domain objects. These operate at the application layer
 * since current Amplify auth DSL cannot express multi-record relational predicates.
 */
export const authorizationGuards = {
  /** Ensure a user is an organization member (or admin) before assigning app role */
  async ensureOrgMembership(organizationId: string, userId: string) {
    const existing = await client.models.OrganizationMembership.get({ organizationId, userId })
    if (!existing.data) {
      throw new AuthorizationError(`User ${userId} is not a member of organization ${organizationId}`, 'NOT_ORG_MEMBER')
    }
  },

  /** Prevent removing the last org admin */
  async ensureNotLastOrgAdmin(organizationId: string, userId: string) {
  const list = await client.models.OrganizationMembership.list(withAuth({ filter: { organizationId: { eq: organizationId }, role: { eq: 'ORG_ADMIN' } } }))
    const admins = (list.data || []).map(r => r.userId)
    if (admins.length === 1 && admins[0] === userId) {
      throw new AuthorizationError('Cannot remove the last organization admin', 'LAST_ORG_ADMIN')
    }
  },

  /** Ensure application admin assignment user already belongs to org */
  async validateAppAdminGrant(applicationId: string, organizationId: string, userId: string) {
    await this.ensureOrgMembership(organizationId, userId)
    // Check not already admin
    const existing = await client.models.ApplicationRoleAssignment.get({ applicationId, userId })
    const row: any = (existing as any).data // generated types may refine later
    if (row && row.role === 'APP_ADMIN') {
      throw new AuthorizationError('User already an application admin', 'DUP_APP_ADMIN')
    }
  },

  /** Ensure engagement role assignment user belongs to related org and (optionally) application */
  async validateEngagementAssignment(engagementId: string, applicationId: string, organizationId: string, userId: string) {
    await this.ensureOrgMembership(organizationId, userId)
    // If contributor/collaborator ensure they have at least read app role (optional future expansion)
  },

  /** Disallow privilege downgrade if user is sole admin at a narrower scope */
  async preventSoleAdminDowngrade(scope: 'org' | 'app', scopeId: string, userId: string) {
    if (scope === 'org') {
      await this.ensureNotLastOrgAdmin(scopeId, userId)
    } else {
  const list = await client.models.ApplicationRoleAssignment.list(withAuth({ filter: { applicationId: { eq: scopeId }, role: { eq: 'APP_ADMIN' } } }))
      const admins = (list.data || []).map(r => r.userId)
      if (admins.length === 1 && admins[0] === userId) {
        throw new AuthorizationError('Cannot downgrade last application admin', 'LAST_APP_ADMIN')
      }
    }
  }
}

export type AuthorizationGuards = typeof authorizationGuards