import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGlobalCommandPalette, registerCommands } from '@/composables/useCommandPalette'

describe('Command Palette async command handling', () => {
  beforeEach(()=>{
    registerCommands([
      { id:'a.async', title:'Async Network Task', async: true, run: ()=> new Promise(res=> setTimeout(()=> res('done'), 10)) }
    ])
  })

  it('sets and clears runningCommandId for async command', async () => {
    const pal = useGlobalCommandPalette()
    const cmd = pal.results.value.find(c=>c.id==='a.async')!
    const p = pal.run(cmd)
    expect(pal.runningCommandId.value).toBe('a.async')
    await p
    expect(pal.runningCommandId.value).toBeNull()
  })
})
