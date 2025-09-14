import { a } from '@aws-amplify/backend';

export const EntitlementAudit = a.model({
  organizationId: a.id().required(),
  action: a.enum(['ASSIGN_PLAN','CHANGE_STATUS','OVERRIDE_FEATURES']),
  actor: a.string(),
  before: a.json(),
  after: a.json(),
  ts: a.datetime().required()
})
// Audit lookup by organizationId and chronological queries by ts
.secondaryIndexes((index) => [ index('organizationId'), index('ts') ])
.authorization((allow) => [
  allow.group('admin').to(['create','read']),
  allow.authenticated().to(['read']) // org admins will filter client side; sensitive diffs should exclude secrets.
]);
