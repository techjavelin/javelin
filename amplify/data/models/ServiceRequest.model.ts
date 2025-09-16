import { a } from '@aws-amplify/backend';

// Enumerates high-level service request types a client user can submit
export const ServiceRequestType = a.enum([
  'ENGAGEMENT',      // New or follow-on engagement
  'RETTEST',         // Retest / validation request
  'CONSULTING',      // General consulting / advisory time
  'REPORT_EXPORT',   // Additional report/export format
  'OTHER'            // Freeform catch‑all
]);

// Lifecycle status for a service request
export const ServiceRequestStatus = a.enum([
  'OPEN',            // Submitted and awaiting triage
  'IN_REVIEW',       // Under internal review / clarification
  'APPROVED',        // Approved and will progress to fulfillment (e.g., engagement scoping)
  'REJECTED',        // Rejected (will include resolutionNotes)
  'FULFILLED',       // Fully actioned (e.g., engagement created / work performed)
  'CLOSED'           // Closed administratively (duplicate / stale)
]);

// A lightweight client -> provider service request ticket. Intentionally simple; 
// future: link to Engagement / Project records via foreign key once fulfilled.
export const ServiceRequest = a.model({
  organizationId: a.id().required(),
  requestedBy: a.string().required(),        // username / sub of requester
  type: a.ref('ServiceRequestType').required(),
  // Default handled at creation time in composable (Amplify schema builder here lacks .default support on ref chains)
  status: a.ref('ServiceRequestStatus').required(),
  title: a.string().required(),              // short title supplied by user
  details: a.string(),                       // markdown details / justification
  priority: a.integer(),                     // optional client-provided priority (1=highest)
  resolutionNotes: a.string(),               // internal notes when resolving
  relatedEngagementId: a.string(),           // optional linkage once approved/fulfilled
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.group('admin'),                                   // full access
    allow.group('pentester').to(['read','update']),         // can view for context
    allow.authenticated().to(['create','read']),            // any authenticated can create & read (filtered by org in UI)
  ]);
