import { ref, computed } from 'vue'
import { getCurrentUser, fetchUserAttributes, type AuthUser, updatePassword, confirmSignIn } from 'aws-amplify/auth'

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
