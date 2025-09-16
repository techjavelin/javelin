import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFindings } from '@/composables/useFindings'
import { useAuthorization } from '@/composables/useAuthorization'

// Mock authorization to always allow ENG.UPDATE_FINDING
vi.mock('@/composables/useAuthorization', () => ({
  useAuthorization: () => ({ has: () => true })
}))

// Mock Amplify client model interactions
vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: {
      VulnerabilityFinding: {
        list: async () => ({ data: [] }),
        create: async (input: any) => ({ data: { id: 'real-id-1', reportedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), closedAt: null, ...input } }),
        update: async (input: any) => ({ data: { ...input, updatedAt: new Date().toISOString() } })
      }
    }
  })
}))

describe('Finding publication workflow', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
  })

  it('creates a draft finding by default', async () => {
    const { create } = useFindings()
    const finding: any = await create({
      engagementId: 'eng1', applicationId: 'app1', title: 'XSS', severity: 'HIGH', status: 'OPEN'
    } as any)
    expect(finding.publicationStatus).toBe('DRAFT')
  })

  it('publishes a finding via update', async () => {
    const { create, update, findings } = useFindings()
    const f: any = await create({ engagementId: 'eng1', applicationId: 'app1', title: 'SQLi', severity: 'CRITICAL', status: 'OPEN' } as any)
    expect(f.publicationStatus).toBe('DRAFT')
    const updated: any = await update(f.id, 'eng1', { publicationStatus: 'PUBLISHED' } as any)
    expect(updated?.publicationStatus).toBe('PUBLISHED')
    expect(findings.value.find(x => x.id === f.id)?.publicationStatus).toBe('PUBLISHED')
  })

  it('preserves updatedAt timestamp change on publish', async () => {
    const { create, update } = useFindings()
    const f: any = await create({ engagementId: 'eng1', applicationId: 'app1', title: 'CSRF', severity: 'MEDIUM', status: 'OPEN' } as any)
    const before = f.updatedAt
    vi.setSystemTime(new Date('2025-01-02T00:00:00Z'))
    const up: any = await update(f.id, 'eng1', { publicationStatus: 'PUBLISHED' } as any)
    expect(new Date(up.updatedAt).getTime()).toBeGreaterThan(new Date(before).getTime())
  })

  it('idempotent publish (second publish does not throw)', async () => {
    const { create, update } = useFindings()
    const f: any = await create({ engagementId: 'eng1', applicationId: 'app1', title: 'Info leak', severity: 'LOW', status: 'OPEN' } as any)
    await update(f.id, 'eng1', { publicationStatus: 'PUBLISHED' } as any)
    await update(f.id, 'eng1', { publicationStatus: 'PUBLISHED' } as any)
    expect(true).toBe(true)
  })
})
