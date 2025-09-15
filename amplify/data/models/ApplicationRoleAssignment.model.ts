import { a } from '@aws-amplify/backend';

// Roles at the application scope for client-side users
export const ApplicationRole = a.enum([
  'APP_ADMIN',      // manage application, engagements, assignments
  'APP_CONTRIBUTOR',// comment on findings, view engagement details
  'APP_READ_ONLY'   // view only
]);

export const ApplicationRoleAssignment = a.model({
  applicationId: a.id().required(),
  organizationId: a.id().required(), // denormalized for scoping queries
  userId: a.string().required(),
  role: a.ref('ApplicationRole').required(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
  grantedBy: a.string(),
})
  .identifier(['applicationId','userId'])
  .authorization(allow => [
    allow.group('admin'),
    // Removed ownersDefinedIn to prevent implicit userId injection; read filtered at application layer
    allow.authenticated().to(['read']),
  ]);
