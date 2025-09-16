// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import Profile from '@/pages/Profile.vue'
import { useAuth } from '@/composables/useAuth'

// Minimal mock for fetch responses
function mockFetchSequence(responses: any[]){
  let i = 0
  global.fetch = vi.fn().mockImplementation(()=>{
    const body = responses[Math.min(i, responses.length-1)]
    i++
    return Promise.resolve({ ok: true, status: 200, text: async () => JSON.stringify(body) })
  }) as any
}

describe('Profile backup codes UI', () => {
  beforeEach(()=>{
    const auth = useAuth()
    ;(auth as any).currentUser.value = { userId: 'user-1', username: 'user-1' }
    auth.mfaEnabled.value = true
    auth.mfaConfirming.value = false
    auth.mfaBackupCodes.value = ['AAAAA-BBBBB','CCCCC-DDDDD']
    ;(global as any).URL = (global as any).URL || {}
    ;(global as any).URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
    ;(global as any).URL.revokeObjectURL = vi.fn()
  })

  it('copies all codes', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  const wrapper = mount(Profile, { global: { components: { PageWrapper: { template: '<div><slot /></div>' } } } })
    const copyBtn = wrapper.findAll('button.mini-btn').find(b=> b.text()==='Copy All')!
    await copyBtn.trigger('click')
    expect(writeText).toHaveBeenCalled()
  })

  it('downloads codes (creates anchor)', async () => {
    const append = vi.spyOn(document.body, 'appendChild')
  const wrapper = mount(Profile, { global: { components: { PageWrapper: { template: '<div><slot /></div>' } } } })
    const dlBtn = wrapper.findAll('button.mini-btn').find(b=> b.text()==='Download')!
    await dlBtn.trigger('click')
    expect(append).toHaveBeenCalled()
  })

  it('handles regeneration fetch', async () => {
    mockFetchSequence([{ codes:['ZZZZZ-YYYYY','PPPPP-QQQQQ'] }])
    const auth = useAuth()
  const wrapper = mount(Profile, { global: { components: { PageWrapper: { template: '<div><slot /></div>' } } } })
    const regen = wrapper.findAll('button.mini-btn').find(b=> /Regenerate/.test(b.text()))!
    await regen.trigger('click')
    expect(auth.mfaBackupCodes.value[0]).toBe('ZZZZZ-YYYYY')
  })
})
