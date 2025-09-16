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

// Mock organizations composable with variable data sets
const orgsMany = [
  { id: 'org-1', name: 'Alpha Org' },
  { id: 'org-2', name: 'Beta Org' }
]
const orgsSingle = [{ id: 'org-only', name: 'Solo Org' }]
let currentOrgs = orgsMany

vi.mock('../src/composables/useOrganizations', () => ({
  useOrganizations: () => ({ organizations: { value: currentOrgs }, fetchOrganizations: vi.fn(async () => {}) })
}))

// Mock applications composable
const appsMany = [
  { id: 'app-1', name: 'Portal', organizationId: 'org-1' },
  { id: 'app-2', name: 'API', organizationId: 'org-1' },
  { id: 'app-3', name: 'Mobile', organizationId: 'org-2' }
]
const appsSingle = [ { id: 'app-only', name: 'Single App', organizationId: 'org-only' } ]
let currentApps = appsMany

vi.mock('../src/composables/useApplications', () => ({
  useApplications: () => ({ applications: { value: currentApps }, list: vi.fn(async () => {}) })
}))

// Minimal router for component requirements
const router = createRouter({
  history: createWebHistory(),
  routes: [{ path: '/', component: { template: '<div />' } }]
})

describe('NewEngagement selection logic', () => {
  beforeEach(() => {
    currentOrgs = orgsMany
    currentApps = appsMany
  })

  it('enables live search and does not auto-select when multiple orgs', async () => {
  await router.push('/')
  await router.isReady()
  const wrapper = mount(NewEngagement, { global: { plugins: [router], stubs: { 'router-link': { template: '<a><slot /></a>' } } } })
  await nextTick(); await new Promise(r => setTimeout(r, 0))
    const orgInput = wrapper.find('input[placeholder="Search organization..."]')
    expect(orgInput.exists()).toBe(true)
    // Should not be read-only
    expect((orgInput.element as HTMLInputElement).readOnly).toBe(false)
  })

  it('auto-selects and locks org when only one', async () => {
    currentOrgs = orgsSingle
    currentApps = appsSingle
  await router.push('/')
  await router.isReady()
  const wrapper = mount(NewEngagement, { global: { plugins: [router], stubs: { 'router-link': { template: '<a><slot /></a>' } } } })
    await nextTick(); await nextTick(); await new Promise(r => setTimeout(r, 0))
    const orgInput = wrapper.find('input[placeholder="Organization selected"]')
    expect(orgInput.exists()).toBe(true)
    expect((orgInput.element as HTMLInputElement).readOnly).toBe(true)
    expect((orgInput.element as HTMLInputElement).value).toContain('Solo Org')
  })

  it('disables application input until org selected', async () => {
  await router.push('/')
  await router.isReady()
  const wrapper = mount(NewEngagement, { global: { plugins: [router], stubs: { 'router-link': { template: '<a><slot /></a>' } } } })
  await nextTick(); await new Promise(r => setTimeout(r, 0))
    const appInput = wrapper.find('input[placeholder="Select organization first"]')
    expect(appInput.exists()).toBe(true)
    expect((appInput.element as HTMLInputElement).readOnly).toBe(true)
  })

  it('auto-selects single application for chosen org', async () => {
    currentOrgs = orgsSingle
    currentApps = appsSingle
  await router.push('/')
  await router.isReady()
  const wrapper = mount(NewEngagement, { global: { plugins: [router], stubs: { 'router-link': { template: '<a><slot /></a>' } } } })
  await nextTick(); await new Promise(r => setTimeout(r, 0))
    const chips = wrapper.findAll('.chip')
    expect(chips.length).toBe(1)
    expect(chips[0].text()).toContain('Single App')
  })
})
