import { describe, it, expect } from 'vitest'
import { useGlobalCommandPalette } from '../src/composables/useCommandPalette'
import { resetCommandPaletteForTests } from '../src/composables/useCommandPalette'

// Test basic hide unauthorized toggle mechanics. We run in unauthenticated context (default),
// so admin/pentester routes should be filtered out when hide is enabled.

describe('Command Palette hide unauthorized toggle', () => {
  it('filters admin nav commands when enabled', () => {
    resetCommandPaletteForTests()
    const palette: any = useGlobalCommandPalette()
    // Ensure commands built
    const before = palette.results.value.filter((c:any)=> c.id.startsWith('nav.') && /Admin/.test(c.title))
    expect(before.length).toBeGreaterThan(0) // Should be present initially

    // Find toggle command
    const toggle = palette.listAllCommands().find((c:any)=> c.id === 'prefs.toggleHideUnauthorized')
    expect(toggle).toBeTruthy()
    toggle.run()

    const after = palette.results.value.filter((c:any)=> c.id.startsWith('nav.') && /Admin/.test(c.title))
    expect(after.length).toBe(0)
  })
})
