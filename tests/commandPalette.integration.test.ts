import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGlobalCommandPalette, resetCommandPaletteForTests } from '@/composables/useCommandPalette'

// Since useCommandPalette imports the router singleton directly, mock that module.
const mockPushes: any[] = []
vi.mock('../src/router', () => ({
  default: {
    getRoutes: () => [
      { path: '/', name: 'home', meta: {} },
      { path: '/about', name: 'about', meta: {} }
    ],
    afterEach: () => {},
    push: (p: any) => { mockPushes.push(p) }
  }
}))

describe('Command Palette integration', () => {
  beforeEach(()=>{ mockPushes.length = 0 })

  it('runs a navigation command and closes palette', async () => {
  resetCommandPaletteForTests()
  const pal = useGlobalCommandPalette()
    pal.openPalette()
    expect(pal.open.value).toBe(true)
    // Find a built-in nav command 'Go: Home'
    const home = pal.results.value.find(c=>/Go: Home/.test(c.title))
    expect(home).toBeTruthy()
    if(home){ pal.run(home) }
    expect(mockPushes.some(p=> p === '/' || (p?.path === '/'))).toBe(true)
    expect(pal.open.value).toBe(false)
  })
})
