import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== BLOG DATA MODELS =====================================================
This section creates comprehensive blog functionality with posts, authors,
tags, categories, and comments. The schema supports rich content management
with proper relationships and authorization.
=========================================================================*/
const schema = a.schema({
  // Blog Post model - main content entity
  BlogPost: a
    .model({
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
      
      // SEO fields
      seoTitle: a.string(),
      seoKeywords: a.string(),
      
      // Content structure
      tableOfContents: a.json(),
      
      // Relationships
      authorId: a.id().required(),
      author: a.belongsTo('Author', 'authorId'),
      
      // Many-to-many relationships
      postTags: a.hasMany('PostTag', 'postId'),
      postCategories: a.hasMany('PostCategory', 'postId'),
      comments: a.hasMany('Comment', 'postId'),
      analytics: a.hasMany('BlogAnalytics', 'postId'),
      
      // Timestamps
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
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
      allow.group("admin").to(['create', 'update', 'delete'])
    ]),

  // Author model - blog authors and contributors
  Author: a
    .model({
      name: a.string().required(),
      email: a.email().required(),
      bio: a.string(),
      avatarUrl: a.url(),
      website: a.url(),
      twitterHandle: a.string(),
      linkedinProfile: a.url(),
      githubProfile: a.url(),
      
      // Author metadata
      isActive: a.boolean().default(true),
      joinedAt: a.datetime(),
      
      // Relationships
      posts: a.hasMany('BlogPost', 'authorId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
      allow.group("admin").to(['create', 'update', 'delete'])
    ]),

  // Tag model - for content categorization
  Tag: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      color: a.string(), // hex color for UI
      
      // Relationships
      postTags: a.hasMany('PostTag', 'tagId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
      allow.group("admin").to(['create', 'update', 'delete'])
    ]),

  // Category model - for hierarchical organization
  Category: a
    .model({
      name: a.string().required(),
      slug: a.string().required(),
      description: a.string(),
      color: a.string(),
      
      // Hierarchical structure
      parentId: a.id(),
      parent: a.belongsTo('Category', 'parentId'),
      children: a.hasMany('Category', 'parentId'),
      
      // Relationships
      postCategories: a.hasMany('PostCategory', 'categoryId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
      allow.group("admin").to(['create', 'update', 'delete'])
    ]),

  // Join table for Post-Tag many-to-many relationship
  PostTag: a
    .model({
      postId: a.id().required(),
      tagId: a.id().required(),
      
      post: a.belongsTo('BlogPost', 'postId'),
      tag: a.belongsTo('Tag', 'tagId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete'])
    ]),

  // Join table for Post-Category many-to-many relationship
  PostCategory: a
    .model({
      postId: a.id().required(),
      categoryId: a.id().required(),
      
      post: a.belongsTo('BlogPost', 'postId'),
      category: a.belongsTo('Category', 'categoryId'),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['read']),
      allow.owner().to(['create', 'update', 'delete']),
      allow.group("admin").to(['create', 'update', 'delete'])
    ]),

  // Comment model - for user engagement
  Comment: a
    .model({
      content: a.string().required(),
      authorName: a.string().required(),
      authorEmail: a.email().required(),
      authorWebsite: a.url(),
      
      // Comment metadata
      isApproved: a.boolean().default(false),
      isSpam: a.boolean().default(false),
      
      // Hierarchical comments (replies)
      parentId: a.id(),
      parent: a.belongsTo('Comment', 'parentId'),
      replies: a.hasMany('Comment', 'parentId'),
      
      // Relationships
      postId: a.id().required(),
      post: a.belongsTo('BlogPost', 'postId'),
      
      // Timestamps
      createdAt: a.datetime(),
      updatedAt: a.datetime(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['read']),
      allow.authenticated().to(['create', 'read', 'update']),
      allow.owner().to(['create', 'update', 'delete']),
      allow.group("admin").to(['create', 'update', 'delete'])
    ]),

  // Newsletter subscription model
  Newsletter: a
    .model({
      email: a.email().required(),
      name: a.string(),
      isSubscribed: a.boolean().default(true),
      subscribedAt: a.datetime(),
      unsubscribedAt: a.datetime(),
      
      // Preferences
      frequency: a.enum(['WEEKLY', 'MONTHLY']),
      topics: a.string().array(), // Array of topic preferences
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create']),
      allow.owner().to(['create', 'read', 'update', 'delete']),
      allow.group("admin").to(['create', 'read', 'update', 'delete'])
    ]),

  // Blog analytics model
  BlogAnalytics: a
    .model({
      postId: a.id().required(),
      event: a.enum(['VIEW', 'LIKE', 'SHARE', 'COMMENT']),
      userAgent: a.string(),
      ipAddress: a.string(),
      referrer: a.url(),
      
      // Relationships
      post: a.belongsTo('BlogPost', 'postId'),
      
      // Timestamp
      timestamp: a.datetime(),
    })
    .authorization((allow) => [
      allow.publicApiKey().to(['create']),
      allow.group("admin").to(['read'])
    ]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    // API Key is used for a.allow.public() rules
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

/*== USAGE EXAMPLES =======================================================
Frontend usage examples for the blog data models:

// Blog Posts
const posts = await client.models.BlogPost.list();
const post = await client.models.BlogPost.get({ id: 'post-id' });
const newPost = await client.models.BlogPost.create({
  title: 'My Blog Post',
  slug: 'my-blog-post',
  content: 'Post content...',
  status: 'PUBLISHED',
  authorId: 'author-id'
});

// Authors
const authors = await client.models.Author.list();

// Tags and Categories
const tags = await client.models.Tag.list();
const categories = await client.models.Category.list();

// Comments
const comments = await client.models.Comment.list({
  filter: { postId: { eq: 'post-id' } }
});
=========================================================================*/

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: todos } = await client.models.Todo.list()

// return <ul>{todos.map(todo => <li key={todo.id}>{todo.content}</li>)}</ul>
