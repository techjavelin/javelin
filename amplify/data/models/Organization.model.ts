import { a } from '@aws-amplify/backend';

export const Organization = a.model({
  // Basic Information
  name: a.string().required(),

  // Lifecycle Status
  // Amplify enum types currently don't support inline .default(); creation logic will set 'PENDING' explicitly
  status: a.enum(['PENDING','ACTIVE']),
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

  // External Integrations
  quickbooksClientId: a.string(), // ID of linked QuickBooks customer (if associated)
  quickbooksClientName: a.string(), // Cached customer display name for convenience

})
// Authorization Rules
.authorization((allow) => [
  // Only platform admins can create organizations
  allow.group("admin").to(['create', 'read', 'update', 'delete']),
  // Allow any signed-in user to read (broad visibility). If you need to restrict later,
  // replace with a narrower rule or introduce a view model.
  allow.authenticated().to(['read']),
  // Once activated, admins listed on record manage it
  allow.ownersDefinedIn('admins').to(['update', 'read']),
  // Members still read
  allow.ownersDefinedIn('members').to(['read']),
]);
