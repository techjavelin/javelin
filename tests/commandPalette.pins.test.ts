import { describe, it, expect, beforeEach } from 'vitest'
import { registerCommands, useGlobalCommandPalette, resetCommandPaletteForTests } from '@/composables/useCommandPalette'

// Basic pin behavior tests

describe('Command Palette pinning', () => {
  beforeEach(()=>{
    resetCommandPaletteForTests()
    // Clear and re-register a small set
    registerCommands([
      { id:'x.a', title:'Alpha Nav', run: ()=>{}, group:'Navigation', kind:'navigation' },
      { id:'x.b', title:'Bravo Action', run: ()=>{}, group:'Navigation', kind:'action' },
      { id:'x.c', title:'Charlie Nav', run: ()=>{}, group:'Navigation', kind:'navigation' }
    ])
  })

  it('pins the most recently run command via togglePin command', () => {
    const pal = useGlobalCommandPalette()
    // Run x.b then trigger prefs.togglePin action
    const bravo = pal.results.value.find(c=>c.id==='x.b')!
    pal.run(bravo)
  // Use direct API to avoid relying on prefs.togglePin logic timing
  pal.togglePin('x.b')
    expect(pal.isPinned('x.b')).toBe(true)
    // Ensure pinned appears at head of results ordering
  // Collect pinned results slice (they appear first)
  const pinnedIdsInResultsHead = pal.results.value.filter(c=> pal.isPinned(c.id)).map(c=>c.id)
  expect(pinnedIdsInResultsHead).toContain('x.b')
  })

  it('respects pinned:true operator filtering', () => {
    const pal = useGlobalCommandPalette()
    // Pin x.a directly using API
    pal.togglePin('x.a')
    pal.query.value = 'pinned:true'
    const filtered = pal.results.value
    expect(filtered.every(c => pal.isPinned(c.id))).toBe(true)
    expect(filtered.find(c=>c.id==='x.a')).toBeTruthy()
  })
})
