import { describe, it, expect } from 'vitest'
import { humanFileSize } from '@/utils/file'

describe('humanFileSize', () => {
  it('formats base sizes', () => {
    expect(humanFileSize(0)).toBe('0 B')
    expect(humanFileSize(500)).toBe('500 B')
    expect(humanFileSize(1024)).toBe('1 KB')
  })
  it('formats with decimal when <10 of higher unit', () => {
    expect(humanFileSize(1536)).toBe('1.5 KB')
  })
  it('handles megabytes', () => {
    expect(humanFileSize(1048576)).toBe('1 MB')
  })
  it('handles invalid inputs', () => {
    expect(humanFileSize(undefined)).toBe('-')
    expect(humanFileSize(null as any)).toBe('-')
    expect(humanFileSize(-1)).toBe('-')
  })
})
