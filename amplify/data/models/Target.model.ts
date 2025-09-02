import { a } from '@aws-amplify/backend';

export const TargetType = a.enum([
  'WEBSITE',
  'DOMAIN',
  'SOCIAL_FOOTPRINT',
  'CLOUD_PROVIDER',
  'IP_ADDRESS',
  'CUSTOM'
]);

export const Target = a.model({
  // Basic Information
  name: a.string().required(),
  type: a.ref('TargetType').required(),
  config: a.json(),
  metadata: a.json(),

  // Relationships
  scopeId: a.id().required(),
  organizationId: a.id().required(),

  organization: a.belongsTo('Organization', 'organizationId'),
  scope: a.belongsTo('Scope', 'scopeId'),

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
  allow.ownersDefinedIn('organization.admins').to(['create', 'read', 'update', 'delete']),
  allow.ownersDefinedIn('scope.admins').to(['create', 'read', 'update', 'delete']),
  allow.ownersDefinedIn('organization.members').to(['read']),
  allow.ownersDefinedIn('scope.members').to(['read']),
  allow.ownersDefinedIn('admins').to(['read', 'update', 'delete']),
  allow.ownersDefinedIn('members').to(['read']),
]);
