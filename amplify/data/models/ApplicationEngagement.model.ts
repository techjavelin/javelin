import { a } from '@aws-amplify/backend'

// Join model for many-to-many between Application and Engagement
export const ApplicationEngagement = a.model({
  applicationId: a.id().required(),
  engagementId: a.id().required(),
  organizationId: a.id().required(),
  createdAt: a.datetime(),
  createdBy: a.string(),
}).authorization(allow => [
  allow.group('admin'),
  allow.group('pentester').to(['create','read','delete']),
  allow.authenticated().to(['read'])
])
  .secondaryIndexes(idx => [
    idx('applicationId'),
    idx('engagementId')
  ])
