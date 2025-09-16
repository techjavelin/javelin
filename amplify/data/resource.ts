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
import { PentesterProfile, PentesterAvailability } from "./models/PentesterProfile.model";
import { Application, ApplicationType, UserType } from "./models/Application.model";
import { Engagement, EngagementPhase, EngagementStatus } from "./models/Engagement.model";
import { ApplicationEngagement } from "./models/ApplicationEngagement.model";
import { VulnerabilityTemplate, VulnerabilityCategory, Severity } from "./models/VulnerabilityTemplate.model";
import { VulnerabilityFinding, FindingStatus, PublicationStatus } from "./models/VulnerabilityFinding.model";
import { ArtifactLink, ArtifactProvider, DocumentType, ArtifactStatus } from "./models/ArtifactLink.model";
import { OrganizationMembership, OrgRole } from "./models/OrganizationMembership.model";
import { ApplicationRoleAssignment, ApplicationRole } from "./models/ApplicationRoleAssignment.model";
import { EngagementRoleAssignment, EngagementUserRole } from "./models/EngagementRoleAssignment.model";
import { Migration } from "./models/Migration.model";
import { Project, ProjectStatus } from "./models/Project.model";
import { MfaBackupCode } from "./models/MfaBackupCode.model";
import { ServiceRequest, ServiceRequestStatus, ServiceRequestType } from "./models/ServiceRequest.model";

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
  PentesterAvailability,
  ApplicationType,
  UserType,
  Application,
  EngagementPhase,
  EngagementStatus,
  Engagement,
  VulnerabilityCategory,
  Severity,
  ApplicationEngagement,
  VulnerabilityTemplate,
  VulnerabilityFinding,
  FindingStatus,
  PublicationStatus,
  ArtifactLink,
  ArtifactProvider,
  DocumentType,
  ArtifactStatus,
  OrganizationMembership,
  OrgRole,
  ApplicationRoleAssignment,
  ApplicationRole,
  EngagementRoleAssignment,
  EngagementUserRole,
  Migration,
  Project,
  ProjectStatus,
  MfaBackupCode,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceRequestType,
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    // Flip default to userPool so all unspecified operations require authentication.
    // Public/unauthenticated access now relies on explicit a.allow.public() rules AND
    // frontend callers using withPublic()/authMode:'apiKey' where appropriate.
    defaultAuthorizationMode: "userPool",
    apiKeyAuthorizationMode: {
      // Retain short-lived API key to power truly public content (blog, marketing).
      expiresInDays: 30,
    },
  },
  // Enable CloudWatch/AppSync logging (boolean true enables resolver & request summaries per Amplify Gen2 support)
  logging: true
});

// NOTE: Default authorization mode flipped to 'userPool'. Public read access is now
// intentional and minimal—callers must specify authMode:'apiKey' (via withPublic())
// for models that expose unauthenticated content. Keep API key lifetime short and
// periodically rotate. Review PUBLIC_READ_MODELS in src/amplifyClient.ts when adding
// or removing public data surfaces.

