import { a } from "@aws-amplify/backend";

export const PostTag = a.model({
  postId: a.id().required(),
  tagId: a.id().required(),
  post: a.belongsTo('BlogPost', 'postId'),
  tag: a.belongsTo('Tag', 'tagId'),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.owner().to(['create', 'update', 'delete'])
]);
