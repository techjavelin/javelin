import { describe, it, expect } from 'vitest'
import { deriveSeverityData } from '../src/services/risk'

// Basic vectors for test: High impact, network etc.

describe('deriveSeverityData', () => {
  it('returns provided likelihood/impactLevel directly', async () => {
    const res = await deriveSeverityData({ likelihood:'HIGH' as any, impactLevel:'HIGH' as any })
    expect(res.severity).toBe('HIGH')
  })

  it('infers from CVSS vector when fields missing', async () => {
    const res = await deriveSeverityData({ cvssVector:'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' })
    expect(res.likelihood).toBeDefined()
    expect(res.impactLevel).toBeDefined()
    expect(res.severity).toBeDefined()
  })

  it('partial provided field still infers missing one', async () => {
    const res = await deriveSeverityData({ likelihood:'VERY_HIGH' as any, cvssVector:'AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H' })
    expect(res.likelihood).toBe('VERY_HIGH')
    expect(res.impactLevel).toBeDefined()
  })
})
