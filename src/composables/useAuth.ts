import { ref, computed } from 'vue'
import { getClient, withUserAuth } from '@/amplifyClient'
import { getCurrentUser, fetchUserAttributes, type AuthUser, updatePassword, confirmSignIn, setUpTOTP, verifyTOTPSetup, updateMFAPreference, fetchMFAPreference } from 'aws-amplify/auth'
// Using native fetch for custom function endpoints (assuming same domain / proxy)
const apiBase = (import.meta as any).env?.VITE_API_BASE || ''

// Global state for user authentication
const currentUser = ref<AuthUser | null>(null)
const userAttributes = ref<Record<string, any> | null>(null)
const userGroups = ref<string[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
// Force new password challenge state (e.g., admin created user must set password)
const needsNewPassword = ref(false)
// Stash the latest sign-in session object if we need to confirm with a new password
const pendingSignIn = ref<any | null>(null)
// MFA / TOTP state
const mfaEnabled = ref(false)
const mfaEnabling = ref(false) // during initial secret generation
const mfaConfirming = ref(false) // waiting for user to confirm code
const mfaSecret = ref<string | null>(null)
const mfaOtpAuthUrl = ref<string | null>(null)
const mfaBackupCodes = ref<string[]>([])
const mfaError = ref<string | null>(null)

// Simple base32 alphabet (RFC4648) for secret generation
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
function randomBase32(length = 32){
  const arr: string[] = []
  const cryptoObj = typeof crypto !== 'undefined' ? crypto : undefined
  for(let i=0;i<length;i++){
    let idx: number
    if(cryptoObj && cryptoObj.getRandomValues){
      const buf = new Uint8Array(1)
      cryptoObj.getRandomValues(buf)
      idx = buf[0] % BASE32_ALPHABET.length
    } else {
      idx = Math.floor(Math.random() * BASE32_ALPHABET.length)
    }
    arr.push(BASE32_ALPHABET[idx])
  }
  return arr.join('')
}

function buildOtpAuthUrl(secret: string, account: string, issuer = 'Javelin'){ 
  const label = encodeURIComponent(`${issuer}:${account}`)
  const issuerParam = encodeURIComponent(issuer)
  return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerParam}&algorithm=SHA1&digits=6&period=30`
}

function generateBackupCodes(count = 10){
  const codes: string[] = []
  for(let i=0;i<count;i++){
    // 10 char base32 chunks for readability splitted by dash every 5 chars
    const raw = randomBase32(10)
    codes.push(raw.slice(0,5)+'-'+raw.slice(5))
  }
  return codes
}

// Crypto helpers for backup code hashing
async function sha256Base64Url(input: string){
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuf = await crypto.subtle.digest('SHA-256', data)
  const bytes = new Uint8Array(hashBuf)
  let bin = ''
  for(const b of bytes) bin += String.fromCharCode(b)
  // base64url
  return btoa(bin).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
}

function randomSalt(length=16){
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let out=''
  const buf = new Uint8Array(length)
  crypto.getRandomValues(buf)
  for(const b of buf) out += chars[b % chars.length]
  return out
}

async function hashBackupCode(userId: string, code: string, salt: string){
  return sha256Base64Url(`${userId}:${code}:${salt}`)
}

const dataClient = getClient()

export function useAuth() {
  // Computed properties
  const isAuthenticated = computed(() => !!currentUser.value)
  const isAdmin = computed(() => {
    // Check if user is in admin group or has admin email
    return userGroups.value.includes('admin') || 
           (currentUser.value as any)?.signInDetails?.loginId === 'admin@techjavelin.com'
  })
  
  const userEmail = computed(() => {
    return userAttributes.value?.email || (currentUser.value as any)?.signInDetails?.loginId || null
  })
  
  const userName = computed(() => {
    const firstName = userAttributes.value?.given_name || ''
    const lastName = userAttributes.value?.family_name || ''
    return firstName && lastName ? `${firstName} ${lastName}` : userEmail.value
  })

  // Methods
  const loadCurrentUser = async () => {
    loading.value = true
    error.value = null
    
    try {
      const user = await getCurrentUser()
      currentUser.value = user
      
      // Load user attributes
      const attributes = await fetchUserAttributes()
      userAttributes.value = attributes as Record<string, any>
      // Attempt to load MFA preference (ignore failures for older backends)
      try {
        const pref = await fetchMFAPreference()
        // pref?.preferred or enabled list may include SOFTWARE_TOKEN_MFA
        const softwareEnabled = (pref as any)?.enabled?.includes('SOFTWARE_TOKEN_MFA') || (pref as any)?.preferred === 'SOFTWARE_TOKEN_MFA'
        mfaEnabled.value = !!softwareEnabled
      } catch {/* ignore */}
      
      // Extract groups from custom attributes or tokens
      // In a real implementation, you might need to decode JWT tokens
      // or make an additional API call to get user groups
      const customGroups = attributes['custom:groups'] as string
      if (customGroups) {
        userGroups.value = customGroups.split(',')
      } else if ((user as any).signInDetails?.loginId === 'admin@techjavelin.com') {
        // Fallback: treat admin email as admin user
        userGroups.value = ['admin']
      }
      
      return user
    } catch (err: any) {
      error.value = err.message || 'Failed to load user'
      currentUser.value = null
      userAttributes.value = null
      userGroups.value = []
      throw err
    } finally {
      loading.value = false
    }
  }
  
  const clearUser = () => {
    currentUser.value = null
    userAttributes.value = null
    userGroups.value = []
    error.value = null
    needsNewPassword.value = false
    pendingSignIn.value = null
    mfaEnabled.value = false
    mfaSecret.value = null
    mfaOtpAuthUrl.value = null
    mfaBackupCodes.value = []
    mfaError.value = null
  }
  
  const checkAdminAccess = () => {
    if (!isAuthenticated.value) {
      throw new Error('User not authenticated')
    }
    
    if (!isAdmin.value) {
      throw new Error('Admin access required')
    }
    
    return true
  }

  return {
    // State
    currentUser,
    userAttributes,
    userGroups,
    loading,
    error,
    needsNewPassword,
    
    // Computed
    isAuthenticated,
    isAdmin,
    userEmail,
    userName,
    
    // Methods
    loadCurrentUser,
    clearUser,
    checkAdminAccess,
    // Password management
    async changePassword(oldPassword: string, newPassword: string) {
      if (!currentUser.value) throw new Error('Not authenticated')
      try {
        loading.value = true
        await updatePassword({ oldPassword, newPassword })
        return true
      } catch (e: any) {
        error.value = e?.message || 'Change password failed'
        throw e
      } finally {
        loading.value = false
      }
    },
    // Handle a sign-in response that indicates NEW_PASSWORD_REQUIRED.
    markNewPasswordRequired(signInResult: any) {
      needsNewPassword.value = true
      pendingSignIn.value = signInResult
    },
    async completeNewPassword(newPassword: string) {
      if (!needsNewPassword.value || !pendingSignIn.value) throw new Error('No pending new password challenge')
      try {
        loading.value = true
        const res = await confirmSignIn({ challengeResponse: newPassword })
        needsNewPassword.value = false
        pendingSignIn.value = null
        // After completion, refresh user context
        await loadCurrentUser()
        return res
      } catch (e: any) {
        error.value = e?.message || 'Failed to set new password'
        throw e
      } finally {
        loading.value = false
      }
    },
    // MFA / TOTP public state & actions
    mfaEnabled,
    mfaEnabling,
    mfaConfirming,
    mfaSecret,
    mfaOtpAuthUrl,
    mfaBackupCodes,
    mfaError,
    async redeemBackupCode(code: string){
      if(!currentUser.value) throw new Error('Not authenticated')
      if(!code) throw new Error('Code required')
      try {
  const res = await fetch(apiBase + '/mfa/backupCodes/redeem', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ userId: currentUser.value.userId, code }) })
        const bodyText = await res.text()
        const data = JSON.parse(bodyText)
        if(data.redeemed){
          // remove from local list
            mfaBackupCodes.value = mfaBackupCodes.value.filter(c=> c !== code)
          return true
        }
        return false
      } catch { return false }
    },
    async regenerateBackupCodes(count = 10){
      if(!currentUser.value) throw new Error('Not authenticated')
      try {
        const res = await fetch(apiBase + '/mfa/backupCodes/regenerate', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ userId: currentUser.value.userId, count }) })
        let data: any = null
        try { data = await res.json() } catch { data = null }
        if(Array.isArray(data?.codes)){
          // Assign new array to trigger reactivity even if same reference pattern mocked
          mfaBackupCodes.value = [...data.codes]
          return mfaBackupCodes.value
        }
        return []
      } catch { return [] }
    },
    async startMfaEnrollment(){
      if(!currentUser.value) throw new Error('Not authenticated')
      if(mfaEnabled.value) throw new Error('MFA already enabled')
      try {
        mfaError.value = null
        mfaEnabling.value = true
        // Use Amplify to initiate TOTP; returns a secret shared key
  const setupDetails: any = await setUpTOTP()
  const secret: string = typeof setupDetails === 'string' ? setupDetails : (setupDetails?.sharedSecret || setupDetails?.secret || setupDetails?.totpCode || '')
  mfaSecret.value = secret
        const email = userEmail.value || 'user'
        mfaOtpAuthUrl.value = buildOtpAuthUrl(secret, email)
        // Generate backup codes locally (should later be persisted server-side hashed)
        mfaBackupCodes.value = generateBackupCodes(10)
        // Persist hashed codes
        try {
          const uid = currentUser.value.userId as string
          await Promise.all(mfaBackupCodes.value.map(async code => {
            const salt = randomSalt(12)
            const hash = await hashBackupCode(uid, code, salt)
            await dataClient.models.MfaBackupCode.create({ userId: uid, hash, salt, used: false }, withUserAuth())
          }))
        } catch(e){ /* non-fatal */ }
        mfaConfirming.value = true
        return { secret, otpauth: mfaOtpAuthUrl.value }
      } catch (e: any) {
        mfaError.value = e?.message || 'Failed to start MFA enrollment'
        throw e
      } finally {
        mfaEnabling.value = false
      }
    },
    async confirmMfa(code: string){
      if(!mfaSecret.value || !mfaConfirming.value) throw new Error('No MFA enrollment in progress')
      try {
        mfaError.value = null
        if(!/^\d{6}$/.test(code)) throw new Error('Invalid code format')
        // Verify with Amplify
        await verifyTOTPSetup({ code })
        // Set user preference to prefer software token
        // Attempt to set software token MFA as preferred; API shape varies across Amplify versions.
        try {
          // Some versions accept: updateMFAPreference({ totp: 'PREFERRED' })
          await (updateMFAPreference as any)({ totp: 'PREFERRED' })
        } catch {
          try { await (updateMFAPreference as any)('SOFTWARE_TOKEN_MFA') } catch {/* ignore if unsupported */}
        }
        mfaEnabled.value = true
        mfaConfirming.value = false
        return true
      } catch (e: any) {
        mfaError.value = e?.message || 'Failed to confirm MFA'
        throw e
      }
    },
    async disableMfa(){
      if(!mfaEnabled.value) return
      try {
        mfaError.value = null
  try { await (updateMFAPreference as any)({ totp: 'DISABLED' }) } catch { /* ignore */ }
        mfaEnabled.value = false
        mfaSecret.value = null
        mfaOtpAuthUrl.value = null
        // Optionally mark all backup codes as used (soft invalidate)
        try {
          if(currentUser.value){
            const uid = currentUser.value.userId as string
            // naive list & update (could batch if API allows). We don't have filter builder here so assume listAll via generator not available; placeholder pseudo-call.
            // If generated types support predicate, we could use: dataClient.models.MfaBackupCode.list({ filter: { userId: { eq: uid } }}, withUserAuth())
            const listResp: any = await (dataClient as any).models.MfaBackupCode.list({ filter: { userId: { eq: uid } } }, withUserAuth())
            const items = listResp?.data || listResp?.items || []
            await Promise.all(items.map((item: any) => {
              if(!item.used){
                return dataClient.models.MfaBackupCode.update({ id: item.id, used: true, usedAt: new Date().toISOString() }, withUserAuth())
              }
            }))
          }
        } catch {/* ignore */}
        mfaBackupCodes.value = []
        return true
      } catch (e: any) {
        mfaError.value = e?.message || 'Failed to disable MFA'
        throw e
      }
    }
  }
}

// Admin-specific functionality
export function useAdminAuth() {
  const auth = useAuth()
  
  const requireAdmin = async () => {
    if (!auth.currentUser.value) {
      await auth.loadCurrentUser()
    }
    
    auth.checkAdminAccess()
    return true
  }
  
  return {
    ...auth,
    requireAdmin
  }
}
