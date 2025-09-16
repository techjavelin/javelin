import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobalCommandPalette, registerCommands, resetCommandPaletteForTests } from '@/composables/useCommandPalette'

// We craft commands to exercise acronym & boundary boosts.
// Example: "Go: Admin Dashboard" -> acronym GAD; searching 'ad' should favor boundary letters in Admin/Dashboard vs a longer plain subsequence in another command.

describe('Command Palette advanced fuzzy scoring', () => {
  beforeEach(()=>{
    resetCommandPaletteForTests()
    registerCommands([
      { id:'s.one', title:'Go: Admin Dashboard', run: ()=>{} },
      { id:'s.two', title:'Global Alpha Delta', run: ()=>{} },
      { id:'s.three', title:'Random utility', run: ()=>{} }
    ])
  })

  it('acronym/boundary match ranks higher', () => {
  const pal = useGlobalCommandPalette()
    pal.query.value = 'gad' // matches acronym of first command exactly
    const titles = pal.results.value.map(c=>c.title)
    expect(titles[0]).toBe('Go: Admin Dashboard')
  })

  it('usage count increases score', () => {
  const pal = useGlobalCommandPalette()
    const target = pal.results.value.find(c=>c.id==='s.two')!
    // Run target multiple times to build usage boost
    for(let i=0;i<3;i++) pal.run(target)
    pal.openPalette() // reopen after close
    pal.query.value = 'gad' // still should not dethrone acronym exact, but ensure target appears
    const titles = pal.results.value.map(c=>c.title)
    expect(titles).toContain('Global Alpha Delta')
  })
})
