import { a } from '@aws-amplify/backend';

export const Organization = a.model({
  // Basic Information
  name: a.string().required(),

  // Lifecycle Status
  status: a.enum(['PENDING','ACTIVE']).default('PENDING'),
  invitedAdminEmail: a.string(),
  createdBy: a.string(),
  activatedAt: a.datetime(),
  activatedBy: a.string(),

  // Relationships
  scopes: a.hasMany('Scope', 'organizationId'),
  targets: a.hasMany('Target', 'organizationId'),

  // Authorization Roles
  admins: a.string().array().required(), // initially empty until activation
  members: a.string().array(),

  // Metadata
  createdAt: a.datetime(),
  updatedAt: a.datetime(),

})
// Authorization Rules
.authorization((allow) => [
  // Only platform admins can create organizations
  allow.group("admin").to(['create', 'read', 'update', 'delete']),
  // Once activated, admins listed on record manage it
  allow.ownersDefinedIn('admins').to(['update', 'read']),
  // Members still read
  allow.ownersDefinedIn('members').to(['read']),
]);
