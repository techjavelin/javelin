import { a } from '@aws-amplify/backend';

// Generic integration artifact linking model (Pandadoc, QuickBooks, etc.)
export const ArtifactProvider = a.enum([
  'PANDADOC',
  'QUICKBOOKS',
  'OTHER'
]);

export const DocumentType = a.enum([
  'NDA',
  'SOW',
  'RULES_OF_ENGAGEMENT',
  'ESTIMATE',
  'OTHER'
]);

export const ArtifactStatus = a.enum([
  'DRAFT','SENT','COMPLETED','VOIDED','ERROR'
]);

export const ArtifactLink = a.model({
  engagementId: a.id(), // optional if artifact relates to platform but not a single engagement
  organizationId: a.id(),
  provider: a.ref('ArtifactProvider').required(),
  externalId: a.string().required(),
  name: a.string().required(),
  description: a.string(),
  documentType: a.ref('DocumentType'),
  status: a.ref('ArtifactStatus'),
  // Flexible metadata for provider-specific fields (signer emails, amounts, etc.)
  metadata: a.json(),
  lastSyncAt: a.datetime(),
  errorMessage: a.string(),
  createdBy: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.group('admin'),
    allow.group('pentester').to(['create','read','update']),
    allow.authenticated().to(['read']),
  ]);
