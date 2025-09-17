import { a } from '@aws-amplify/backend';

// Simplified Artifact model: represents an uploaded internal file only.
// All previous provider / external document concepts removed (pre-production refactor).
export const ArtifactLink = a.model({
  organizationId: a.id().required(),
  engagementId: a.id(),
  applicationId: a.id(),
  name: a.string().required(), // display name (default: original filename)
  description: a.string(),
  storageKey: a.string().required(), // S3 object key
  contentType: a.string(),
  size: a.integer(), // bytes
  sha256: a.string(), // optional file hash (hex)
  createdBy: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.group('admin'),
    allow.group('pentester').to(['create','read','update','delete']),
    allow.authenticated().to(['read']),
  ]);
