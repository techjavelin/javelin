import { a } from "@aws-amplify/backend";

export const PostCategory = a.model({
  postId: a.id().required(),
  categoryId: a.id().required(),
  post: a.belongsTo('BlogPost', 'postId'),
  category: a.belongsTo('Category', 'categoryId'),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.owner().to(['create', 'update', 'delete']),
  allow.group("admin").to(['create', 'update', 'delete'])
]);
