import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: { Migration: { list: vi.fn().mockResolvedValue({ data: [] }) } }
  })
}))

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn().mockResolvedValue({ tokens: { idToken: 'test-id-token' } })
}))

// Dynamic JSON import mock
vi.mock('../../amplify_outputs.json', () => ({
  default: {
    custom: {
      MIGRATIONS: { latest: 5 },
      API: { Dummy: { endpoint: 'https://example.test' } }
    }
  }
}))

// Mock fetch for network calls
const fetchSpy = vi.fn(async (url: string, init: any) => {
  if(url.endsWith('/migrations-state')) {
    return {
      ok: true,
      json: async () => ({ migrations: [ { id: 1 }, { id: 2 } ], lock: null })
    } as any
  }
  if(url.endsWith('/run-migrations')) {
    return {
      ok: true,
      json: async () => ({ summary: { applied: 1, skipped: 0, failed: null } })
    } as any
  }
  return { ok: false, status: 404, text: async () => 'nf' } as any
})
// @ts-ignore
global.fetch = fetchSpy

import { useMigrations } from '@/composables/useMigrations'

describe('useMigrations', () => {
  beforeEach(() => {
    fetchSpy.mockClear()
  })

  it('loads state with auth header', async () => {
    const { fetchState, appliedList } = useMigrations()
    await fetchState()
    expect(appliedList.value.length).toBe(2)
    const stateCall = fetchSpy.mock.calls.find(c => (c[0] as string).endsWith('/migrations-state'))
    expect(stateCall).toBeTruthy()
    expect(stateCall![1].headers.Authorization).toBe('test-id-token')
  })

  it('runs pending with takeover flag when requested', async () => {
    const { runPending } = useMigrations()
    await runPending({ takeover: true })
    const runCall = fetchSpy.mock.calls.find(c => (c[0] as string).endsWith('/run-migrations'))
    expect(runCall).toBeTruthy()
    const body = JSON.parse(runCall![1].body)
    expect(body.takeover).toBe(true)
  })
})
