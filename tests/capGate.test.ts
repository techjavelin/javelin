import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CapGate from '@/components/CapGate.vue'

// Mock useAuthorization composable
vi.mock('@/composables/useAuthorization', () => ({
  useAuthorization: () => ({ has: (cap: string) => cap === 'ENG.MANAGE' })
}))

describe('CapGate', () => {
  it('renders slot when capability granted', () => {
    const wrapper = mount(CapGate, { props: { capability: 'ENG.MANAGE' }, slots: { default: '<span id="ok">Hi</span>' } })
    expect(wrapper.find('#ok').exists()).toBe(true)
  })
  it('hides slot when capability missing', () => {
    const wrapper = mount(CapGate, { props: { capability: 'ENG.UPDATE_FINDING' }, slots: { default: '<span id="no">No</span>' } })
    expect(wrapper.find('#no').exists()).toBe(false)
  })
  it('inverts logic when not prop set', () => {
    const wrapper = mount(CapGate, { props: { capability: 'ENG.UPDATE_FINDING', not: true }, slots: { default: '<span id="inv">Inverse</span>' } })
    expect(wrapper.find('#inv').exists()).toBe(true)
  })
})
