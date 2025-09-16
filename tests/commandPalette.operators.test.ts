import { describe, it, expect, beforeEach } from 'vitest'
import { registerCommands, useGlobalCommandPalette, resetCommandPaletteForTests } from '@/composables/useCommandPalette'

describe('Command Palette inline operators', () => {
  beforeEach(()=>{
    registerCommands([
      { id:'o.nav1', title:'Nav One', run: ()=>{}, group:'Blog', kind:'navigation' },
      { id:'o.nav2', title:'Nav Two', run: ()=>{}, group:'Admin', kind:'navigation', keywords:'admin' },
      { id:'o.act1', title:'Action Build', run: ()=>{}, group:'Preferences', kind:'action' }
    ])
  })

  it('filters by group: operator (case-insensitive)', () => {
  resetCommandPaletteForTests()
  const pal = useGlobalCommandPalette()
    pal.query.value = 'group:blog'
    expect(pal.results.value.every(c=> (c.group||'').toLowerCase()==='blog')).toBe(true)
  })

  it('filters by kind:action operator', () => {
  resetCommandPaletteForTests()
  const pal = useGlobalCommandPalette()
    pal.query.value = 'kind:action'
    expect(pal.results.value.every(c=> c.kind==='action')).toBe(true)
  })

  it('filters by role:admin operator using keywords heuristic', () => {
  resetCommandPaletteForTests()
  const pal = useGlobalCommandPalette()
    pal.query.value = 'role:admin'
    expect(pal.results.value.every(c=> /admin/.test(c.keywords||''))).toBe(true)
  })
})
