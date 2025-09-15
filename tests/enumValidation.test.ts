import { describe, it, expect } from 'vitest'
import { validateEnums } from '../scripts/validate-enums'

// Narrow test just asserts function shape works; we cannot guarantee dynamic model changes here.

describe('validateEnums', () => {
  it('returns structure with enums + missing', () => {
    const result = validateEnums()
    expect(result).toHaveProperty('enums')
    expect(result).toHaveProperty('missing')
    expect(Array.isArray(result.enums)).toBe(true)
    expect(Array.isArray(result.missing)).toBe(true)
  })
})
