import { a } from '@aws-amplify/backend';

// Represents a user's relationship to an organization with a specific role.
// Separate from the Organization.admins/members arrays to allow richer role metadata
// and future auditing / invitation states.
export const OrgRole = a.enum(['ORG_ADMIN','ORG_MEMBER']);

export const OrganizationMembership = a.model({
  organizationId: a.id().required(),
  userId: a.string().required(), // Cognito username / sub or stable loginId
  role: a.ref('OrgRole').required(),
  // Lifecycle / metadata
  invitedBy: a.string(),
  acceptedAt: a.datetime(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .identifier(['organizationId','userId'])
  .authorization(allow => [
    // Platform admins full access
    allow.group('admin'),
    // Removed ownersDefinedIn to avoid implicit userId collision; row-level ownership enforced in app logic
    // General authenticated read (to discover org memberships) - tighten later if needed
    allow.authenticated().to(['read']),
  ]);
