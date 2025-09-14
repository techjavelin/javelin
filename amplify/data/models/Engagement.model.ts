import { a } from '@aws-amplify/backend';

export const EngagementPhase = a.enum([
  'PLANNING','RECON','TESTING','REPORTING','REMEDIATION','CLOSED'
]);

export const EngagementStatus = a.enum([
  'ACTIVE','ON_HOLD','COMPLETED','CANCELLED'
]);

export const Engagement = a.model({
  organizationId: a.id().required(),
  code: a.string().required(), // human slug
  title: a.string().required(),
  phase: a.ref('EngagementPhase').required(),
  status: a.ref('EngagementStatus').required(),
  startDate: a.date(),
  endDate: a.date(),
  actualStart: a.datetime(),
  actualEnd: a.datetime(),
  executiveSummary: a.string(), // markdown
  constraints: a.string(), // markdown
  exceptions: a.string(), // markdown
  scopeNotes: a.string(), // markdown
  contacts: a.json(), // array of { name, role, email }
  pentesters: a.string().array(),
  clientPocs: a.string().array(),
  pandadocEnvelopeId: a.string(),
  createdBy: a.string(),
  createdAt: a.datetime(),
  updatedAt: a.datetime(),
})
  .authorization(allow => [
    allow.group('admin'),
    allow.group('pentester').to(['create','read','update']),
    allow.authenticated().to(['read']),
    allow.ownersDefinedIn('pentesters').to(['update','read']),
  ]);
