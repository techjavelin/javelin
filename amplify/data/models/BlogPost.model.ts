import { a } from "@aws-amplify/backend";

export const BlogPost = a.model({
  title: a.string().required(),
  slug: a.string().required(),
  summary: a.string(),
  content: a.string().required(),
  excerpt: a.string(),
  metaDescription: a.string(),
  previewImageUrl: a.url(),
  previewImageAlt: a.string(),
  status: a.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
  publishedAt: a.datetime(),
  featuredPost: a.boolean().default(false),
  readTime: a.integer(),
  viewCount: a.integer().default(0),
  seoTitle: a.string(),
  seoKeywords: a.string(),
  tableOfContents: a.json(),
  authorId: a.id().required(),
  author: a.belongsTo('Author', 'authorId'),
  postTags: a.hasMany('PostTag', 'postId'),
  postCategories: a.hasMany('PostCategory', 'postId'),
  comments: a.hasMany('Comment', 'postId'),
  analytics: a.hasMany('BlogAnalytics', 'postId'),
  createdAt: a.datetime().authorization((allow) => [
    allow.owner().to(['create', 'read']),
    allow.publicApiKey().to(['read']),
    allow.authenticated().to(['read'])
  ]),
  updatedAt: a.datetime().authorization((allow) => [
    allow.owner().to(['create', 'read']),
    allow.publicApiKey().to(['read']),
    allow.authenticated().to(['read'])
  ]),
}).authorization((allow) => [
  allow.publicApiKey().to(['read']),
  allow.authenticated().to(['read']),
  allow.owner().to(['create', 'update', 'delete']),
  allow.group("admin").to(['create', 'update', 'delete'])
]);
