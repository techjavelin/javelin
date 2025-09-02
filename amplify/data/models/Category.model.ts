import { a } from "@aws-amplify/backend";

export const Category = a.model({
  name: a.string().required(),
  slug: a.string().required(),
  description: a.string(),
  color: a.string(),
  parentId: a.id(),
  parent: a.belongsTo('Category', 'parentId'),
  children: a.hasMany('Category', 'parentId'),
  postCategories: a.hasMany('PostCategory', 'categoryId'),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.owner().to(['create', 'update', 'delete']),
  allow.group("admin").to(['create', 'update', 'delete'])
]);
