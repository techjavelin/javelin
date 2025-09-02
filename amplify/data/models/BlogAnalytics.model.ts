import { a } from "@aws-amplify/backend";

export const BlogAnalytics = a.model({
  postId: a.id().required(),
  event: a.enum(['VIEW', 'LIKE', 'SHARE', 'COMMENT']),
  userAgent: a.string(),
  ipAddress: a.string(),
  referrer: a.url(),
  post: a.belongsTo('BlogPost', 'postId'),
  timestamp: a.datetime(),
}).authorization((allow) => [
  allow.publicApiKey().to(['create']),
  allow.group("admin").to(['read'])
]);
