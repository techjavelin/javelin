import { a } from '@aws-amplify/backend';

export const Feature = a.model({
  key: a.string().required(), // e.g. 'ADV_REPORTS'
  name: a.string().required(),
  description: a.string(),
  productId: a.id().required(),
  // Which service levels include this by default (denormalized for quick lookup)
  defaultInServiceLevels: a.string().array(),
  active: a.boolean().default(true),
  createdAt: a.datetime(),
  updatedAt: a.datetime()
})
// Add index on productId for grouping features per product
.secondaryIndexes((index) => [ index('productId') ])
.authorization((allow) => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);
