import { a } from '@aws-amplify/backend';

// Replaced enums with data-driven models
export const ApplicationType = a.model({
  key: a.string().required(), // unique natural key
  label: a.string().required(),
  description: a.string(),
  active: a.boolean().default(true),
  rank: a.integer(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
}).authorization(allow => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);

export const UserType = a.model({
  key: a.string().required(),
  label: a.string().required(),
  description: a.string(),
  active: a.boolean().default(true),
  rank: a.integer(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
}).authorization(allow => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);

export const Application = a.model({
  organizationId: a.id().required(),
  name: a.string().required(),
  description: a.string(),
  applicationTypeKey: a.string().required(), // FK-like natural key referencing ApplicationType.key
  userTypeKeys: a.string().array(), // multi-select referencing UserType.key
  repoUrl: a.string(),
  prodUrl: a.string(),
  stagingUrl: a.string(),
  tags: a.string().array(),
  dataSensitivity: a.string(), // now free-form or future data-driven model
  engagementCount: a.integer(),
  createdBy: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.group('admin'),
    allow.authenticated().to(['read']),
  ]);
