import { a } from '@aws-amplify/backend';

export const EntitlementPlan = a.model({
  key: a.string().required(), // e.g. 'PULSE_PRO'
  productId: a.id().required(),
  serviceLevelId: a.id().required(),
  name: a.string().required(),
  description: a.string(),
  featureKeys: a.string().array().required(),
  addOnFeatureKeys: a.string().array(),
  isDefault: a.boolean().default(false),
  active: a.boolean().default(true),
  createdAt: a.datetime(),
  updatedAt: a.datetime()
})
// Indexes to query plans by product or service level
.secondaryIndexes((index) => [ index('productId'), index('serviceLevelId') ])
.authorization((allow) => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);
