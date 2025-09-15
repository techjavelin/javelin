import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGlobalCommandPalette, registerCommands } from '@/composables/useCommandPalette'

// Mock vue-router push used inside commands
vi.mock('vue-router', () => {
  return {
    useRouter: () => ({ push: vi.fn().mockImplementation((p)=>{ mockPushes.push(p) }) })
  }
})
const mockPushes: any[] = []

describe('Command Palette integration', () => {
  beforeEach(()=>{ mockPushes.length = 0 })

  it('runs a navigation command and closes palette', async () => {
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
