import { a } from '@aws-amplify/backend';

export const ServiceLevel = a.model({
  key: a.string().required(), // 'FREE' | 'PRO' | 'ENT'
  name: a.string().required(),
  description: a.string(),
  rank: a.integer().required(), // ordering / precedence
  active: a.boolean().default(true),
  createdAt: a.datetime(),
  updatedAt: a.datetime()
})
// Index on key for quick resolution
.secondaryIndexes((index) => [ index('key') ])
.authorization((allow) => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);
