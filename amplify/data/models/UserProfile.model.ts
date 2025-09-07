import { a } from '@aws-amplify/backend';

export const UserProfile = a.model({
  username: a.string().required(),
  email: a.email().required(),
  displayName: a.string(),
  avatarUrl: a.url(),
  bio: a.string(),
  website: a.url(),
  organizations: a.string().array(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
.authorization((allow) => [
  allow.owner().to(['read', 'update', 'delete']),
  allow.group('admin').to(['create', 'read', 'update', 'delete']),
  allow.publicApiKey().to(['read'])
]);
