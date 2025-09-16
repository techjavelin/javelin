/** @vitest-environment jsdom */
import { mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import { nextTick } from 'vue'
import NewEngagement from '../src/pages/NewEngagement.vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../src/composables/useEngagements', () => ({
  useEngagements: () => ({ create: vi.fn(async (input: any) => ({ id: 'eng-1', ...input })) })
}))
vi.mock('../src/composables/useEngagementApplications', () => ({
  useEngagementApplications: () => ({ attach: vi.fn(async () => true) })
}))

// Single org & single app scenario
const orgsSingle = [{ id: 'org-only', name: 'Solo Org' }]
let currentOrgs = orgsSingle
vi.mock('../src/composables/useOrganizations', () => ({
  useOrganizations: () => ({ organizations: { value: currentOrgs }, fetchOrganizations: vi.fn(async () => {}) })
}))

const appsSingle = [ { id: 'app-only', name: 'Single App', organizationId: 'org-only' } ]
let currentApps = appsSingle
vi.mock('../src/composables/useApplications', () => ({
  useApplications: () => ({ applications: { value: currentApps }, list: vi.fn(async () => {}) })
}))

const router = createRouter({ history: createWebHistory(), routes: [{ path: '/', component: { template: '<div />' } }]})

describe('NewEngagement deselect application', () => {
  beforeEach(() => {
    currentOrgs = orgsSingle
    currentApps = appsSingle
  })

  it('allows deselecting the auto-selected single application', async () => {
    await router.push('/')
    await router.isReady()
    const wrapper = mount(NewEngagement, { global: { plugins: [router], stubs: { 'router-link': { template: '<a><slot /></a>' } } } })
    await nextTick(); await nextTick(); await new Promise(r => setTimeout(r, 0))

    // Chip should exist initially
    let chips = wrapper.findAll('.chip')
    expect(chips.length).toBe(1)
    expect(chips[0].text()).toContain('Single App')

    // Click X to remove
    await chips[0].find('button').trigger('click')
    await nextTick()
    chips = wrapper.findAll('.chip')
    expect(chips.length).toBe(0)
  })
})
