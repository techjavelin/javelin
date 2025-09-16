import { describe, it, expect, vi, beforeEach } from 'vitest'

const listMock = vi.fn()
const getMock = vi.fn()

vi.mock('aws-amplify/data', () => ({
  generateClient: () => ({
    models: { BlogPost: { list: listMock, get: getMock } }
  })
}))

// Mock auth composable variably
let isAuthenticatedRef = { value: false }
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: isAuthenticatedRef })
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({ withErrorToast: async (_l: string, fn: any) => fn() })
}))

describe('blog public access', () => {
  beforeEach(() => {
    listMock.mockReset()
    getMock.mockReset()
    isAuthenticatedRef.value = false
  })

  it('anonymous list uses published filter and public wrapper', async () => {
    listMock.mockResolvedValue({ data: [] })
    const { useBlog } = await import('@/composables/blog/useBlog')
    const { fetchPosts } = useBlog()
    await fetchPosts({ force: true })
    const call = listMock.mock.calls[0][0]
    // Expect filter present enforcing published constraint for anon
    expect(call.filter).toEqual({ status: { eq: 'PUBLISHED' } })
  })

  it('authenticated list has no forced published filter', async () => {
    isAuthenticatedRef.value = true
    listMock.mockResolvedValue({ data: [] })
    const { useBlog } = await import('@/composables/blog/useBlog')
    const { fetchPosts } = useBlog()
    await fetchPosts({ force: true })
    const call = listMock.mock.calls[0][0]
    expect(call.filter).toBeUndefined()
  })

  it('anonymous get blocks unpublished post', async () => {
    getMock.mockResolvedValue({ data: { id: '1', status: 'DRAFT' } })
    const { useBlog } = await import('@/composables/blog/useBlog')
    const { fetchPostById, currentPost, error } = useBlog()
    const res = await fetchPostById('1')
    expect(res).toBeNull()
    expect(currentPost.value).toBeNull()
    expect(error.value).toBeTruthy()
  })

  it('authenticated get allows unpublished post', async () => {
    isAuthenticatedRef.value = true
    getMock.mockResolvedValue({ data: { id: '1', status: 'DRAFT' } })
    const { useBlog } = await import('@/composables/blog/useBlog')
    const { fetchPostById, currentPost } = useBlog()
    const res = await fetchPostById('1')
    expect(res).not.toBeNull()
    expect(currentPost.value?.id).toBe('1')
  })
})
