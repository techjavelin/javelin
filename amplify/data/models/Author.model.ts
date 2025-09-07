import { a } from "@aws-amplify/backend";

export const Author = a.model({
  name: a.string().required(),
  email: a.email().required(),
  bio: a.string(),
  avatarUrl: a.url(),
  website: a.url(),
  twitterHandle: a.string(),
  linkedinProfile: a.url(),
  githubProfile: a.url(),
  isActive: a.boolean().default(true),
  joinedAt: a.datetime(),
  posts: a.hasMany('BlogPost', 'authorId'),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.owner().to(['update']),
  allow.group("admin").to(['create', 'update', 'delete'])
]);
