import { a } from '@aws-amplify/backend';

export const PulseInviteSubmission = a.model({
  email: a.string().required(),
  organizationName: a.string().required(),
  industry: a.string().required(),
  reason: a.string().required(),
  status: a.string().default('pending'), // pending, invited, rejected
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
// Authorization: allow admin full, allow authenticated create
.authorization((allow) => [
  allow.group('admin').to(['create', 'read', 'update', 'delete']),
  allow.authenticated().to(['create'])
]);
