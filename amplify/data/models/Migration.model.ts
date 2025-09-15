import { a } from '@aws-amplify/backend';

// Tracks applied backend data migrations in order.
// id acts as version number (monotonic). One record per applied migration.
export const Migration = a.model({
  id: a.integer().required(), // migration version number (e.g., 1,2,3) - natural PK
  name: a.string().required(), // human friendly short name
  appliedAt: a.datetime().required(),
  checksum: a.string(), // optional hash of migration logic for drift detection
}).authorization(allow => [
  allow.group('admin').to(['create','read','update','delete']), // full control for admin
  allow.authenticated().to(['read']) // others can read version to make decisions client-side
]);
