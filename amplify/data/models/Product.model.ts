import { a } from '@aws-amplify/backend';

export const Product = a.model({
  key: a.string().required(), // unique stable key (e.g., 'PULSE')
  name: a.string().required(),
  description: a.string(),
  active: a.boolean().default(true),
  createdAt: a.datetime(),
  updatedAt: a.datetime()
})
// Using a secondary index on key for fast lookup
.secondaryIndexes((index) => [ index('key') ])
.authorization((allow) => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);
