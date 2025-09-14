import { a } from '@aws-amplify/backend';

export const OrganizationEntitlement = a.model({
  organizationId: a.id().required(),
  entitlementPlanId: a.id().required(),
  status: a.enum(['ACTIVE','SUSPENDED','EXPIRED']),
  effectiveFrom: a.datetime().required(),
  expiresAt: a.datetime(),
  overrides_addFeatures: a.string().array(),
  overrides_removeFeatures: a.string().array(),
  seatLimit: a.integer(),
  createdBy: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime()
})
// Query org entitlements (active history) by organizationId, and maybe by status
.secondaryIndexes((index) => [ index('organizationId'), index('status') ])
// NOTE: Without direct owner mapping fields, we fallback to admin group for writes and authenticated for read.
.authorization((allow) => [
  allow.group('admin').to(['create','update','delete','read']),
  allow.authenticated().to(['read'])
]);

// NOTE: 'organizationAdmins'/'organizationMembers' virtual owner references rely on a future custom resolver or adaptation.
// If Amplify owner mapping cannot directly resolve these, fallback to allow.authenticated() read and enforce org scoping in API logic.
