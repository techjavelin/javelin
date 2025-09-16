import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAuth } from '@/composables/useAuth'

// Simple mock for fetch to simulate backend function responses
function mockFetchOnce(body: any, ok = true, status = 200){
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok,
    status,
    text: async () => JSON.stringify(body)
  }) as any
}

describe('useAuth backup code flows', () => {
  beforeEach(()=>{
    // prime currentUser
    const auth = useAuth()
    ;(auth as any).currentUser.value = { userId: 'user-1', username: 'user-1' }
  })

  it('regenerates codes and replaces local list', async () => {
    const auth = useAuth()
    mockFetchOnce({ codes: ['AAAAA-BBBBB','CCCCC-DDDDD'] })
    const codes = await (auth as any).regenerateBackupCodes(2)
    expect(codes.length).toBe(2)
    expect(auth.mfaBackupCodes.value).toContain('AAAAA-BBBBB')
  })

  it('redeems a code and removes it locally', async () => {
    const auth = useAuth()
    // seed local list
    auth.mfaBackupCodes.value = ['AAAAA-BBBBB']
    mockFetchOnce({ redeemed: true })
    const ok = await (auth as any).redeemBackupCode('AAAAA-BBBBB')
    expect(ok).toBe(true)
    expect(auth.mfaBackupCodes.value).toHaveLength(0)
  })

  it('fails to redeem invalid code (not removed)', async () => {
    const auth = useAuth()
    auth.mfaBackupCodes.value = ['AAAAA-BBBBB']
    mockFetchOnce({ redeemed: false }, false, 404)
    const ok = await (auth as any).redeemBackupCode('ZZZZZ-XXXXX')
    expect(ok).toBe(false)
    expect(auth.mfaBackupCodes.value).toHaveLength(1)
  })
})
