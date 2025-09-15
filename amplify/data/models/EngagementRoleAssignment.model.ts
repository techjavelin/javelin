import { a } from '@aws-amplify/backend';

// Roles narrowed to a single engagement
export const EngagementUserRole = a.enum([
  'ENG_PENTESTER',       // full update on findings & engagement content
  'ENG_CLIENT_ADMIN',    // similar to app admin but scoped to engagement
  'ENG_COLLABORATOR',    // like contributor limited to this engagement
  'ENG_READ_ONLY'
]);

export const EngagementRoleAssignment = a.model({
  engagementId: a.id().required(),
  applicationId: a.id().required(), // denormalized for joins
  organizationId: a.id().required(),
  userId: a.string().required(),
  role: a.ref('EngagementUserRole').required(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  grantedBy: a.string(),
})
  .identifier(['engagementId','userId'])
  .authorization(allow => [
    allow.group('admin'),
    // Removed ownersDefinedIn - implicit field conflict; rely on authenticated read + app-layer filtering
    allow.authenticated().to(['read']),
  ]);
