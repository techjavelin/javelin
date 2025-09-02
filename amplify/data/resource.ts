import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { BlogPost } from "./models/BlogPost.model";
import { Author } from "./models/Author.model";
import { Tag } from "./models/Tag.model";
import { Category } from "./models/Category.model";
import { PostTag } from "./models/PostTag.model";
import { PostCategory } from "./models/PostCategory.model";
import { Comment } from "./models/Comment.model";
import { Newsletter } from "./models/Newsletter.model";
import { BlogAnalytics } from "./models/BlogAnalytics.model";

const schema = a.schema({
  BlogPost,
  Author,
  Tag,
  Category,
  PostTag,
  PostCategory,
  Comment,
  Newsletter,
  BlogAnalytics,
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
