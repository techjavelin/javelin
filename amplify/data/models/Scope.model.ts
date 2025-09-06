import { a } from '@aws-amplify/backend';

export const Scope = a.model({
  // Basic Information
  name: a.string().required(),
  description: a.string(),

  // Relationships
  organizationId: a.id().required(),

  organization: a.belongsTo('Organization', 'organizationId'),
  targets: a.hasMany('Target', 'scopeId'),

  // Authorization Roles
  admins: a.string().array().required(),
  members: a.string().array(),

  // Metadata
  createdAt: a.datetime(),
  updatedAt: a.datetime()
})
// Authorization Rules
.authorization((allow) => [
  allow.group("admin"),
  allow.ownersDefinedIn('admins').to(['create', 'read', 'update', 'delete']),
  allow.ownersDefinedIn('members').to(['read']),
]);
