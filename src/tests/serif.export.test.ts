import { describe, it, expect } from 'vitest'
import { toSerif } from '@/services/serif'

describe('SERIF export', () => {
  it('includes only published findings', () => {
    const findings: any[] = [
      { id: '1', title: 'CRIT', severity: 'CRITICAL', status: 'OPEN', publicationStatus: 'PUBLISHED', description: 'A', impact: '', remediation: '', references: [], affectedAssets: [], evidence: [], cvssVector: '', cvssScore: 9.8, reportedAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' },
      { id: '2', title: 'Draft Only', severity: 'LOW', status: 'OPEN', publicationStatus: 'DRAFT', reportedAt: '2025-01-01T00:00:00Z', updatedAt: '2025-01-01T00:00:00Z' }
    ]
    const published = findings.filter(f => f.publicationStatus === 'PUBLISHED')
    const doc = toSerif({ id: 'eng1', title: 'Test Engagement' } as any, published as any)
    expect(doc.findings.length).toBe(1)
    expect(doc.findings[0].id).toBe('1')
    expect(doc.engagement.id).toBe('eng1')
    expect(doc.findings[0]).toHaveProperty('severity')
    expect(doc.findings[0]).toHaveProperty('publicationStatus')
  })
})
