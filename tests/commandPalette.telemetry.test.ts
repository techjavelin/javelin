import { describe, it, expect, beforeEach } from 'vitest'
import { useGlobalCommandPalette, registerCommands, setCommandTelemetry, resetCommandPaletteForTests } from '@/composables/useCommandPalette'

describe('Command Palette telemetry events', () => {
  beforeEach(()=>{
    resetCommandPaletteForTests()
    registerCommands([
      { id:'tl.alpha', title:'Telemetry Alpha', run: ()=>{} }
    ])
  })

  it('emits open, run, close sequence', () => {
    const events: string[] = []
    setCommandTelemetry(ev => { events.push(ev.type + (ev.id? ':'+ev.id:'')) })
    const pal = useGlobalCommandPalette()
    pal.openPalette()
    const cmd = pal.results.value.find(c=>c.id==='tl.alpha')!
    pal.run(cmd)
    expect(events[0]).toBe('open')
    expect(events.find(e=> e.startsWith('run:tl.alpha'))).toBeTruthy()
    expect(events[events.length-1]).toBe('close')
  })
})
