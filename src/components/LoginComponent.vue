<template>
  <div class="login-overlay" @click.self="$emit('close')">
    <div class="login-container" @click.stop>
      <div class="login-header">
        <button class="close-button" @click="$emit('close')" type="button">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
          </svg>
        </button>
        <img src="https://techjavelin.com/wp-content/uploads/2022/10/cropped-Tech-Javelin-Ltd-logos_transparent.png" alt="Tech Javelin Logo" class="login-logo" />
        <h2>{{ isSignUp ? 'Create Account' : 'Welcome Back' }}</h2>
        <p class="login-subtitle">{{ isSignUp ? 'Join Tech Javelin to access exclusive content' : 'Sign in to your account' }}</p>
      </div>

      <div class="login-tabs">
        <button 
          :class="['tab-button', { active: !isSignUp }]"
          @click="isSignUp = false"
        >
          Sign In
        </button>
        <button 
          :class="['tab-button', { active: isSignUp }]"
          @click="isSignUp = true"
        >
          Sign Up
        </button>
      </div>

      <form v-if="!forceChangeStep" @submit.prevent="handleSubmit" class="login-form">
        <div v-if="error" class="error-message">
          <svg class="error-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          <svg class="success-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {{ success }}
        </div>

        <div v-if="isSignUp" class="form-group">
          <label for="fullName">Full Name</label>
          <input 
            id="fullName"
            v-model="form.fullName"
            type="text" 
            required
            :disabled="loading"
            placeholder="Enter your full name"
          />
        </div>

        <div class="form-group">
          <label for="email">Email Address</label>
          <input 
            id="email"
            v-model="form.email"
            type="email" 
            required
            :disabled="loading"
            placeholder="Enter your email"
          />
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <div class="password-input">
            <input 
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              required
              :disabled="loading"
              :placeholder="isSignUp ? 'Create a password (min 8 characters)' : 'Enter your password'"
              :minlength="isSignUp ? 8 : 1"
            />
            <button 
              type="button" 
              class="password-toggle"
              @click="showPassword = !showPassword"
              :disabled="loading"
            >
              <svg v-if="showPassword" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
              </svg>
            </button>
          </div>
        </div>

        <div v-if="isSignUp" class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input 
            id="confirmPassword"
            v-model="form.confirmPassword"
            type="password"
            required
            :disabled="loading"
            placeholder="Confirm your password"
          />
        </div>

        <div v-if="!isSignUp" class="form-options">
          <label class="checkbox-label">
            <input type="checkbox" v-model="form.rememberMe" :disabled="loading">
            <span class="checkbox-custom"></span>
            Remember me
          </label>
          <a href="#" @click.prevent="showForgotPassword = true" class="forgot-link">Forgot password?</a>
        </div>

        <button 
          type="submit" 
          class="login-button"
          :disabled="loading"
        >
          <svg v-if="loading" class="loading-spinner" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.416" stroke-dashoffset="31.416">
              <animate attributeName="stroke-dashoffset" dur="2s" values="31.416;0" repeatCount="indefinite"/>
            </circle>
          </svg>
          {{ loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In') }}
        </button>

        <div class="login-divider">
          <span>or</span>
        </div>

        <div class="social-login">
          <button type="button" class="social-button google-button" :disabled="loading">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>

        <p class="login-terms">
          By {{ isSignUp ? 'creating an account' : 'signing in' }}, you agree to our 
          <a href="/terms-conditions" target="_blank">Terms of Service</a> and 
          <a href="/privacy-policy" target="_blank">Privacy Policy</a>.
        </p>
      </form>

  <div v-if="showForgotPassword" class="forgot-password-overlay" @click.self="showForgotPassword = false">
        <div class="forgot-password-form">
          <h3>Reset Password</h3>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
          <form @submit.prevent="handleForgotPassword">
            <input 
              v-model="forgotEmail" 
              type="email" 
              required 
              placeholder="Enter your email address"
              :disabled="loading"
            />
            <div class="forgot-actions">
              <button type="button" @click="showForgotPassword = false" :disabled="loading">Cancel</button>
              <button type="submit" :disabled="loading">Send Reset Link</button>
            </div>
          </form>
        </div>
      </div>
      <!-- Force change password screen -->
      <div v-else class="login-form force-change-wrapper">
        <h3 class="force-title">Set a New Password</h3>
        <p class="force-sub">You need to set a new password before continuing.</p>
        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>
        <form @submit.prevent="submitNewPassword" class="force-change-form">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input id="newPassword" v-model="newPassword" type="password" required :disabled="loading" minlength="8" />
          </div>
          <div class="form-group">
            <label for="confirmNewPassword">Confirm New Password</label>
            <input id="confirmNewPassword" v-model="confirmNewPassword" type="password" required :disabled="loading" minlength="8" />
          </div>
          <button type="submit" class="login-button" :disabled="loading || !canSubmitNewPassword">{{ loading ? 'Updating...' : 'Update Password' }}</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { signUp, signIn, resetPassword, confirmSignUp } from 'aws-amplify/auth'
import { useAuth } from '@/composables/useAuth'

// Props
const props = defineProps({
  initialMode: {
    type: String,
    default: 'signin', // 'signin' or 'signup'
    validator: (value) => ['signin', 'signup'].includes(value)
  }
})

// Emits
const emit = defineEmits(['close', 'success'])

// Reactive state
const isSignUp = ref(props.initialMode === 'signup')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)
const showForgotPassword = ref(false)
const forgotEmail = ref('')

const form = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  rememberMe: false
})

// Force change password state
const auth = useAuth()
const forceChangeStep = ref(false)
const newPassword = ref('')
const confirmNewPassword = ref('')
const canSubmitNewPassword = computed(()=> newPassword.value.length>=8 && newPassword.value===confirmNewPassword.value)

// Computed
const isFormValid = computed(() => {
  if (isSignUp.value) {
    return form.value.fullName && 
           form.value.email && 
           form.value.password && 
           form.value.password.length >= 8 &&
           form.value.password === form.value.confirmPassword
  }
  return form.value.email && form.value.password
})

// Methods
async function handleSubmit() {
  if (!isFormValid.value || loading.value) return

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    if (isSignUp.value) {
      await handleSignUp()
    } else {
      await handleSignIn()
    }
  } catch (err) {
    error.value = err.message || 'An error occurred. Please try again.'
  } finally {
    loading.value = false
  }
}

async function handleSignUp() {
  try {
    const { isSignUpComplete, userId, nextStep } = await signUp({
      username: form.value.email,
      password: form.value.password,
      options: {
        userAttributes: {
          email: form.value.email,
          name: form.value.fullName
        }
      }
    })

    if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
      success.value = 'Account created! Please check your email for a verification code.'
      // Here you could show a confirmation code input
    } else if (isSignUpComplete) {
      success.value = 'Account created successfully!'
      emit('success', { type: 'signup', user: { email: form.value.email, name: form.value.fullName } })
    }
  } catch (error) {
    throw error
  }
}

async function handleSignIn() {
  try {
    const { isSignedIn, nextStep } = await signIn({
      username: form.value.email,
      password: form.value.password
    })
    if (isSignedIn) {
      success.value = 'Successfully signed in!'
      emit('success', { type: 'signin', user: { email: form.value.email } })
    } else if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
      error.value = 'Please check your email and confirm your account first.'
  } else if (nextStep.signInStep === 'NEW_PASSWORD_REQUIRED' || nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
      forceChangeStep.value = true
      auth.markNewPasswordRequired(nextStep)
    }
  } catch (error) {
    throw error
  }
}

async function submitNewPassword(){
  if(!canSubmitNewPassword.value) return
  loading.value = true
  error.value = ''
  success.value = ''
  try {
    await auth.completeNewPassword(newPassword.value)
    success.value = 'Password updated! You are now signed in.'
    emit('success', { type: 'signin', user: { email: form.value.email } })
  } catch(e){
    error.value = e.message || 'Failed to set new password'
  } finally {
    loading.value = false
  }
}

async function handleForgotPassword() {
  if (!forgotEmail.value || loading.value) return

  loading.value = true
  error.value = ''

  try {
    await resetPassword({ username: forgotEmail.value })
    success.value = 'Password reset instructions sent to your email!'
    showForgotPassword.value = false
    forgotEmail.value = ''
  } catch (err) {
    error.value = err.message || 'Failed to send reset email. Please try again.'
  } finally {
    loading.value = false
  }
}

// Reset form when switching modes
function resetForm() {
  form.value = {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false
  }
  error.value = ''
  success.value = ''
  showPassword.value = false
}

// Watch for mode changes
import { watch } from 'vue'
watch(isSignUp, () => {
  resetForm()
})
</script>

<style scoped>
.login-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.login-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 440px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.login-header {
  text-align: center;
  padding: 2rem 2rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
}

.login-logo {
  height: 40px;
  margin-bottom: 1rem;
}

.login-header h2 {
  color: #2566af;
  margin-bottom: 0.5rem;
  font-size: 1.5rem;
  font-weight: 600;
}

.login-subtitle {
  color: #666;
  font-size: 0.9rem;
}

.login-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.tab-button {
  flex: 1;
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
}

.tab-button.active {
  color: #2566af;
  border-bottom-color: #2566af;
}

.tab-button:hover:not(.active) {
  color: #2566af;
  background: #f8f9fa;
}

.login-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2566af;
  box-shadow: 0 0 0 3px rgba(37, 102, 175, 0.1);
}

.form-group input:disabled {
  background: #f8f9fa;
  cursor: not-allowed;
}

.password-input {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.password-toggle svg {
  width: 20px;
  height: 20px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
}

.checkbox-label input {
  margin-right: 0.5rem;
}

.forgot-link {
  color: #2566af;
  text-decoration: none;
  font-size: 0.9rem;
}

.forgot-link:hover {
  text-decoration: underline;
}

.login-button {
  width: 100%;
  padding: 0.875rem;
  background: #2566af;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.login-button:hover:not(:disabled) {
  background: #1e5299;
  transform: translateY(-1px);
}

.login-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  transform: none;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.login-divider {
  text-align: center;
  margin: 1.5rem 0;
  position: relative;
  color: #666;
}

.login-divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e1e5e9;
  z-index: 1;
}

.login-divider span {
  background: white;
  padding: 0 1rem;
  position: relative;
  z-index: 2;
}

.social-login {
  margin-bottom: 1.5rem;
}

.social-button {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  color: #333;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.social-button:hover:not(:disabled) {
  border-color: #2566af;
  background: #f8f9fa;
}

.social-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.social-button svg {
  width: 20px;
  height: 20px;
}

.login-terms {
  font-size: 0.8rem;
  color: #666;
  text-align: center;
  line-height: 1.4;
}

.login-terms a {
  color: #2566af;
  text-decoration: none;
}

.login-terms a:hover {
  text-decoration: underline;
}

.error-message, .success-message {
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.error-message {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fecaca;
}

.success-message {
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #7dd3fc;
}

.error-icon, .success-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.forgot-password-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.forgot-password-form {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  width: 90%;
  max-width: 400px;
}

.forgot-password-form h3 {
  margin-bottom: 0.5rem;
  color: #2566af;
}

.forgot-password-form p {
  margin-bottom: 1.5rem;
  color: #666;
  font-size: 0.9rem;
}

.forgot-password-form input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.forgot-actions {
  display: flex;
  gap: 1rem;
}

.forgot-actions button {
  flex: 1;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
}

.forgot-actions button[type="button"] {
  background: #f8f9fa;
  border: 1px solid #e1e5e9;
  color: #666;
}

.forgot-actions button[type="submit"] {
  background: #2566af;
  border: 1px solid #2566af;
  color: white;
}

.forgot-actions button:hover {
  opacity: 0.9;
}

/* Dark mode */
[data-theme="dark"] .login-container {
  background: #1a1a1a;
  color: #e0e0e0;
}

[data-theme="dark"] .login-header {
  border-bottom-color: #333;
}

[data-theme="dark"] .login-header h2 {
  color: #64b5f6;
}

[data-theme="dark"] .login-subtitle {
  color: #b0b0b0;
}

[data-theme="dark"] .login-tabs {
  border-bottom-color: #333;
}

[data-theme="dark"] .tab-button {
  color: #b0b0b0;
}

[data-theme="dark"] .tab-button.active {
  color: #64b5f6;
  border-bottom-color: #64b5f6;
}

[data-theme="dark"] .tab-button:hover:not(.active) {
  background: #2d2d2d;
  color: #64b5f6;
}

[data-theme="dark"] .form-group label {
  color: #e0e0e0;
}

[data-theme="dark"] .form-group input {
  background: #2d2d2d;
  border-color: #404040;
  color: #e0e0e0;
}

[data-theme="dark"] .form-group input:focus {
  border-color: #64b5f6;
  box-shadow: 0 0 0 3px rgba(100, 181, 246, 0.1);
}

[data-theme="dark"] .form-group input:disabled {
  background: #404040;
}

[data-theme="dark"] .social-button {
  background: #2d2d2d;
  border-color: #404040;
  color: #e0e0e0;
}

[data-theme="dark"] .social-button:hover:not(:disabled) {
  border-color: #64b5f6;
  background: #404040;
}

[data-theme="dark"] .login-divider {
  color: #b0b0b0;
}

[data-theme="dark"] .login-divider::before {
  background: #404040;
}

[data-theme="dark"] .login-divider span {
  background: #1a1a1a;
}

[data-theme="dark"] .forgot-password-form {
  background: #1a1a1a;
}

[data-theme="dark"] .forgot-password-form h3 {
  color: #64b5f6;
}

[data-theme="dark"] .forgot-password-form p {
  color: #b0b0b0;
}

[data-theme="dark"] .forgot-password-form input {
  background: #2d2d2d;
  border-color: #404040;
  color: #e0e0e0;
}

[data-theme="dark"] .forgot-actions button[type="button"] {
  background: #2d2d2d;
  border-color: #404040;
  color: #b0b0b0;
}

.close-button {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 8px;
  border-radius: 8px;
  transition: all 0.2s ease;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.close-button:hover {
  color: #374151;
  background: #f3f4f6;
}

.close-button svg {
  width: 16px;
  height: 16px;
}

[data-theme="dark"] .close-button {
  color: #9ca3af;
}

[data-theme="dark"] .close-button:hover {
  color: #e5e7eb;
  background: #374151;
}
</style>
