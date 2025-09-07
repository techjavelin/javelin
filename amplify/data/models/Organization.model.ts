import { a } from '@aws-amplify/backend';

export const Organization = a.model({
  // Basic Information
  name: a.string().required(),

  // Relationships
  scopes: a.hasMany('Scope', 'organizationId'),
  targets: a.hasMany('Target', 'organizationId'),

  // Authorization Roles
  admins: a.string().array().required(),
  members: a.string().array(),

  // Metadata
  createdAt: a.datetime(),
  updatedAt: a.datetime(),

})
// Authorization Rules
.authorization((allow) => [
  allow.group("admin").to(['create', 'read', 'update', 'delete']),
  allow.ownersDefinedIn('admins').to(['update']),
  allow.ownersDefinedIn('members').to(['read']),
]);
