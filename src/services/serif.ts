// SERIF export utility: transforms internal VulnerabilityFinding records into a SERIF-like JSON
// Reference (simplified) structure for this implementation:
// {
//   schema: 'https://serif.security/v1',
//   engagement: { id, code, title, startDate, endDate },
//   findings: [
//     {
//       id, title, severity, status, publicationStatus,
//       description, impact, remediation, references:[], affectedAssets:[], evidence:[],
//       cvss: { vector, score },
//       timeline: { reportedAt, updatedAt, closedAt }
//     }
//   ]
// }
import type { Schema } from '@/../amplify/data/resource'

export interface SerifFindingOutput {
  id: string
  title: string
  severity: string
  status: string
  publicationStatus: string
  description?: string
  impact?: string
  remediation?: string
  references?: string[]
  affectedAssets?: string[]
  evidence?: any[]
  cvss?: { vector?: string|null; score?: number|null }
  timeline: { reportedAt?: string|null; updatedAt?: string|null; closedAt?: string|null }
}

export interface SerifDocument {
  schema: string
  engagement: { id: string; code?: string; title?: string; startDate?: string|null; endDate?: string|null }
  findings: SerifFindingOutput[]
}

export function toSerif(eng: Partial<Schema['Engagement']['type']>, findings: Schema['VulnerabilityFinding']['type'][]): SerifDocument {
  return {
    schema: 'https://serif.security/v1',
    engagement: {
      id: eng.id!,
      code: eng.code,
      title: eng.title,
      startDate: eng.startDate || null,
      endDate: eng.endDate || null
    },
  findings: findings.map(f => ({
      id: f.id,
      title: f.title,
      severity: String(f.severity),
      status: String(f.status),
      publicationStatus: String((f as any).publicationStatus || 'DRAFT'),
      description: f.description || undefined,
      impact: f.impact || undefined,
      remediation: f.remediation || undefined,
      references: (Array.isArray(f.references)
        ? (f.references.filter(r => !!r && typeof r === 'string' && r.trim().length>0) as string[])
        : []),
      affectedAssets: (Array.isArray(f.affectedAssets)
        ? (f.affectedAssets.filter(a => !!a && typeof a === 'string' && a.trim().length>0) as string[])
        : []),
      evidence: (f.evidence as any) || [],
      cvss: { vector: f.cvssVector, score: f.cvssScore ?? undefined },
      timeline: { reportedAt: f.reportedAt || null, updatedAt: f.updatedAt || null, closedAt: f.closedAt || null }
    }))
  }
}
