import { describe, it, expect, beforeEach } from 'vitest'
import { useAuth } from '../src/composables/useAuth'

// Basic unit tests for MFA workflow logic (client-side simulation)

describe('useAuth MFA workflow', () => {
  beforeEach(() => {
    // Clear any pre-existing singleton state by calling clearUser if set
    const auth = useAuth()
    auth.clearUser()
  })

  it('starts MFA enrollment and produces secret + otpauth URL', async () => {
    const auth = useAuth()
    // Simulate an authenticated user by setting a mock currentUser & email attributes
    ;(auth as any).currentUser.value = { userId: 'u1', signInDetails: { loginId: 'user@example.com' } }
    ;(auth as any).userAttributes.value = { email: 'user@example.com' }

    const res = await auth.startMfaEnrollment()
    expect(res.secret).toBeTruthy()
    expect(res.otpauth).toContain('otpauth://totp/')
    expect(auth.mfaConfirming.value).toBe(true)
  })

  it('confirms MFA with simulated 6-digit code', async () => {
    const auth = useAuth()
    ;(auth as any).currentUser.value = { userId: 'u1', signInDetails: { loginId: 'user@example.com' } }
    ;(auth as any).userAttributes.value = { email: 'user@example.com' }
    await auth.startMfaEnrollment()
    await auth.confirmMfa('123456')
    expect(auth.mfaEnabled.value).toBe(true)
    expect(auth.mfaConfirming.value).toBe(false)
  })

  it('disables MFA and clears secret', async () => {
    const auth = useAuth()
    ;(auth as any).currentUser.value = { userId: 'u1', signInDetails: { loginId: 'user@example.com' } }
    ;(auth as any).userAttributes.value = { email: 'user@example.com' }
    await auth.startMfaEnrollment()
    await auth.confirmMfa('654321')
    expect(auth.mfaEnabled.value).toBe(true)
    await auth.disableMfa()
    expect(auth.mfaEnabled.value).toBe(false)
    expect(auth.mfaSecret.value).toBe(null)
  })

  it('rejects invalid code format', async () => {
    const auth = useAuth()
    ;(auth as any).currentUser.value = { userId: 'u1', signInDetails: { loginId: 'user@example.com' } }
    ;(auth as any).userAttributes.value = { email: 'user@example.com' }
    await auth.startMfaEnrollment()
    await expect(auth.confirmMfa('12ab56')).rejects.toThrow('Invalid code format')
    expect(auth.mfaEnabled.value).toBe(false)
  })
})
