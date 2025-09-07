import { a } from "@aws-amplify/backend";

export const Tag = a.model({
  name: a.string().required(),
  slug: a.string().required(),
  description: a.string(),
  color: a.string(),
  postTags: a.hasMany('PostTag', 'tagId'),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.owner().to(['create', 'update', 'delete']),
  allow.group("admin").to(['create', 'update', 'delete'])
]);
