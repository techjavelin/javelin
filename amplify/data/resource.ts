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


import { Organization } from "./models/Organization.model";
import { Scope } from "./models/Scope.model";
import { Target, TargetType } from "./models/Target.model";
import { UserProfile } from "./models/UserProfile.model";
import { PulseInviteSubmission } from "./models/PulseInviteSubmission.model";

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
  Organization,
  Scope,
  Target,
  TargetType,
  UserProfile,
  PulseInviteSubmission,
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
  logging: true
});

