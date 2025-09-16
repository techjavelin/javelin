import { describe, it, expect } from 'vitest'
import router from '../src/router'
import { useGlobalCommandPalette, resetCommandPaletteForTests } from '../src/composables/useCommandPalette'

// Lightweight mock for role state: we rely on default unauth state; we only assert presence of badges for admin/pentester routes,
// not conditional visibility (router guard handles that). Commands should still be generated with badges in their titles.

describe('Command Palette Role Badges & Rebuild', () => {
  it('includes [Admin] and [Pentester] badges on protected route commands', async () => {
    const palette = useGlobalCommandPalette() as any
    const all = palette.listAllCommands()
    const adminCmds = all.filter((c: any) => c.id.startsWith('nav.') && /\[Admin\]/.test(c.title))
    const pentesterCmds = all.filter((c: any) => c.id.startsWith('nav.') && /\[Pentester\]/.test(c.title))
    // Ensure at least one of each exists (routes define both categories)
    expect(adminCmds.length).toBeGreaterThan(0)
    expect(pentesterCmds.length).toBeGreaterThan(0)
  })

  it('rebuildRouteCommands refreshes nav commands set', () => {
    resetCommandPaletteForTests()
    const palette = useGlobalCommandPalette() as any
    const before = palette.listAllCommands().filter((c: any)=> c.id.startsWith('nav.')).length
    palette.rebuildRouteCommands()
    const after = palette.listAllCommands().filter((c: any)=> c.id.startsWith('nav.')).length
    expect(after).toBeGreaterThan(0)
    expect(after).toEqual(before) // Should be stable given no route change
  })
})
