import { a } from "@aws-amplify/backend";

export const Newsletter = a.model({
  email: a.email().required(),
  name: a.string(),
  isSubscribed: a.boolean().default(true),
  subscribedAt: a.datetime(),
  unsubscribedAt: a.datetime(),
  frequency: a.enum(['WEEKLY', 'MONTHLY']),
  topics: a.string().array(),
  // status workflow: PENDING (awaiting confirmation) -> ACTIVE (confirmed) -> UNSUBSCRIBED
  status: a.enum(['PENDING','ACTIVE','UNSUBSCRIBED']),
  confirmationToken: a.string(), // last issued token (optional traceability)
}).authorization((allow) => [
  allow.publicApiKey().to(['create']),
  allow.owner().to(['create', 'read', 'update', 'delete']),
  allow.group("admin").to(['create', 'read', 'update', 'delete'])
]);
