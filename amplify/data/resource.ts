import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { BlogPost } from "./models/BlogPost.model";
import { Author } from "./models/Author.model";
import { Tag } from "./models/Tag.model";
import { Category } from "./models/Category.model";
import { PostTag } from "./models/PostTag.model";
import { PostCategory } from "./models/PostCategory.model";
import { Comment } from "./models/Comment.model";
import { Newsletter } from "./models/Newsletter.model";
import { NewsletterConfirmationToken } from "./models/NewsletterConfirmationToken.model";
import { BlogAnalytics } from "./models/BlogAnalytics.model";


import { Organization } from "./models/Organization.model";
import { Scope } from "./models/Scope.model";
import { Target, TargetType } from "./models/Target.model";
import { UserProfile } from "./models/UserProfile.model";
import { PulseInviteSubmission } from "./models/PulseInviteSubmission.model";
import { Product } from "./models/Product.model";
import { ServiceLevel } from "./models/ServiceLevel.model";
import { Feature } from "./models/Feature.model";
import { EntitlementPlan } from "./models/EntitlementPlan.model";
import { OrganizationEntitlement } from "./models/OrganizationEntitlement.model";
import { EntitlementAudit } from "./models/EntitlementAudit.model";
import { PentesterProfile } from "./models/PentesterProfile.model";
import { Application } from "./models/Application.model";
import { Engagement } from "./models/Engagement.model";
import { ApplicationEngagement } from "./models/ApplicationEngagement.model";
import { VulnerabilityTemplate } from "./models/VulnerabilityTemplate.model";
import { VulnerabilityFinding } from "./models/VulnerabilityFinding.model";
import { ArtifactLink } from "./models/ArtifactLink.model";

const schema = a.schema({
  BlogPost,
  Author,
  Tag,
  Category,
  PostTag,
  PostCategory,
  Comment,
  Newsletter,
  NewsletterConfirmationToken,
  BlogAnalytics,
  Organization,
  Scope,
  Target,
  TargetType,
  UserProfile,
  PulseInviteSubmission,
  Product,
  ServiceLevel,
  Feature,
  EntitlementPlan,
  OrganizationEntitlement,
  EntitlementAudit,
  PentesterProfile,
  Application,
  Engagement,
  ApplicationEngagement,
  VulnerabilityTemplate,
  VulnerabilityFinding,
  ArtifactLink,
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

// NOTE: Many frontend composables now explicitly specify { authMode: 'userPool' } for
// protected models. We intentionally keep the project default as apiKey to allow
// public read access for blog and marketing content models (BlogPost, Tag, Category, Author, etc.).
// If/when we decide most traffic should require authentication, flip
//   defaultAuthorizationMode: 'userPool'
// and then remove explicit overrides where not needed, re-adding apiKey only for
// the handful of public read paths. A centralized helper (withAuth) exists in
// src/amplifyClient.ts to simplify a future migration.

