import { a } from '@aws-amplify/backend';

export const ApplicationKind = a.enum([
  'WEB_APP', 'API', 'MOBILE', 'CLOUD', 'OTHER'
]);

export const DataSensitivity = a.enum([
  'LOW','MODERATE','HIGH'
]);

export const Application = a.model({
  organizationId: a.id().required(),
  name: a.string().required(),
  description: a.string(),
  kind: a.ref('ApplicationKind').required(),
  repoUrl: a.string(),
  prodUrl: a.string(),
  stagingUrl: a.string(),
  tags: a.string().array(),
  dataSensitivity: a.ref('DataSensitivity'),
  engagementCount: a.integer(),
  createdBy: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.group('admin'),
    allow.authenticated().to(['read']),
    // Simplified owner-based rule (predicate .when not supported in current auth DSL)
    allow.ownersDefinedIn('createdBy').to(['update','delete'])
  ]);
