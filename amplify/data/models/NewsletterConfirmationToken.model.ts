import { a } from "@aws-amplify/backend";

export const NewsletterConfirmationToken = a.model({
  email: a.email().required(),
  token: a.string().required(),
  expiresAt: a.datetime().required(),
  usedAt: a.datetime(),
  // token type distinguishes confirmation vs unsubscribe flows
  type: a.enum(['CONFIRM', 'UNSUBSCRIBE'])
}).authorization((allow) => [
  allow.publicApiKey().to(['create']), // creation initiated publicly
  allow.owner().to(['read','update','delete']),
  allow.group('admin').to(['read','update','delete'])
]);
