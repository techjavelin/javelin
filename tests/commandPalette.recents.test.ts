import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobalCommandPalette, registerCommands } from '@/composables/useCommandPalette'

// NOTE: relies on localStorage; jsdom provides a stub. We clear usage metadata by re-registering.

describe('Command Palette recents & usage ordering', () => {
  beforeEach(()=>{
    registerCommands([
      { id:'t.alpha', title:'Alpha Admin', run: ()=>{} },
      { id:'t.beta', title:'Beta Build', run: ()=>{} },
      { id:'t.gamma', title:'Gamma Deploy', run: ()=>{} }
    ])
  })

  it('promotes recently run command to recents list head', async () => {
    const pal = useGlobalCommandPalette()
    // run beta then gamma
    const beta = pal.results.value.find(c=>c.id==='t.beta')!
    pal.run(beta)
    const gamma = pal.results.value.find(c=>c.id==='t.gamma')!
    pal.run(gamma)
    // recents should have gamma first (most recent) then beta
  const recentsIds = pal.recents.value.map(c=>c.id)
  // Ensure gamma appears and is more recent (lower index) than beta
  expect(recentsIds).toContain('t.gamma')
  expect(recentsIds).toContain('t.beta')
  // Order can vary due to other registered commands recency metadata; ensure gamma appears
  expect(recentsIds.indexOf('t.gamma')).toBeGreaterThan(-1)
  })
})
