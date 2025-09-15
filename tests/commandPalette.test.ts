import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobalCommandPalette, registerCommands } from '@/composables/useCommandPalette'

describe('Command Palette basic behavior', () => {
  beforeEach(()=>{
    // Force singleton reset by re-registering (IDs will override)
    registerCommands([
      { id:'x.alpha', title:'Alpha Command', run: ()=>{} },
      { id:'x.beta', title:'Beta Item', run: ()=>{} },
      { id:'x.gamma', title:'Gamma Tool', run: ()=>{} }
    ])
  })

  it('filters commands with fuzzy scoring', () => {
    const pal = useGlobalCommandPalette()
    pal.query.value = 'gm'
    const titles = pal.results.value.map(c=>c.title)
    expect(titles).toContain('Gamma Tool')
    expect(titles).not.toContain('Alpha Command')
  })

  it('opens and closes with API', () => {
    const pal = useGlobalCommandPalette()
    pal.openPalette()
    expect(pal.open.value).toBe(true)
    pal.closePalette()
    expect(pal.open.value).toBe(false)
  })
})
