import { a } from "@aws-amplify/backend";

export const Comment = a.model({
  content: a.string().required(),
  authorName: a.string().required(),
  authorEmail: a.email().required(),
  authorWebsite: a.url(),
  isApproved: a.boolean().default(false),
  isSpam: a.boolean().default(false),
  parentId: a.id(),
  parent: a.belongsTo('Comment', 'parentId'),
  replies: a.hasMany('Comment', 'parentId'),
  postId: a.id().required(),
  post: a.belongsTo('BlogPost', 'postId'),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['create', 'read', 'update']),
  allow.owner().to(['create', 'update', 'delete']),
  allow.group("admin").to(['create', 'update', 'delete'])
]);
