import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CommandPalette from '@/components/CommandPalette.vue'
import { useGlobalCommandPalette } from '@/composables/useCommandPalette'

// Mock router for core commands
vi.mock('vue-router', () => ({ useRouter: () => ({ push: () => {} }) }))

describe('CommandPalette component integration', () => {
  it('is hidden by default and toggles open/close', async () => {
    const wrapper = mount(CommandPalette)
    const pal = useGlobalCommandPalette()
    // hidden initially
    expect(wrapper.find('.cp-overlay').exists()).toBe(false)
    pal.openPalette()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.cp-overlay').exists()).toBe(true)
    pal.closePalette()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.cp-overlay').exists()).toBe(false)
  })
})
