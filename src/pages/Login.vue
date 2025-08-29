<template>
  <div class="login-page">
    <div class="login-page-content">
      <div class="login-hero">
        <h1>Welcome to Javelin Pulse</h1>
        <p class="hero-subtitle">
          Access your account to explore the Javelin Pulse platform, including premium business applications, technology consulting, and exclusive content—all in a unified, secure ecosystem.
        </p>
        <div class="hero-features">
          <div class="feature-item">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <span>Premium Content</span>
          </div>
          <div class="feature-item">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span>Expert Consultation</span>
          </div>
          <div class="feature-item">
            <svg class="feature-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-1 16H9V7h9v14z"/>
            </svg>
            <span>Resource Library</span>
          </div>
        </div>
      </div>

      <div class="login-demo-section">
        <h2>Authentication Demo</h2>
        <p>Try our custom login component with both sign-in and sign-up functionality:</p>
        
        <div class="demo-buttons">
          <button @click="showLogin('signin')" class="demo-button signin-demo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/>
            </svg>
            Demo Sign In
          </button>
          
          <button @click="showLogin('signup')" class="demo-button signup-demo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M15,14C12.33,14 7,15.33 7,18V20H23V18C23,15.33 17.67,14 15,14M6,10V7H4V10H1V12H4V15H6V12H9V10M15,12A4,4 0 0,0 19,8A4,4 0 0,0 15,4A4,4 0 0,0 11,8A4,4 0 0,0 15,12Z"/>
            </svg>
            Demo Sign Up
          </button>
        </div>

        <div class="demo-info">
          <h3>Features of our Login Component:</h3>
          <ul class="feature-list">
            <li>✅ AWS Amplify Cognito integration</li>
            <li>✅ Email verification and password reset</li>
            <li>✅ Dark mode support</li>
            <li>✅ Responsive design</li>
            <li>✅ Form validation and error handling</li>
            <li>✅ Social login preparation (Google)</li>
            <li>✅ Accessible keyboard navigation</li>
            <li>✅ Professional styling</li>
          </ul>
        </div>
      </div>

      <div class="integration-info">
        <h3>Integration with Amplify</h3>
        <p>
          This component works seamlessly with AWS Amplify authentication. When users sign up,
          they receive email verification. The component handles all authentication flows including:
        </p>
        <div class="auth-flows">
          <div class="flow-item">
            <strong>Sign Up Flow:</strong> Email verification → Account confirmation → Access granted
          </div>
          <div class="flow-item">
            <strong>Sign In Flow:</strong> Credential validation → Session management → Protected content
          </div>
          <div class="flow-item">
            <strong>Password Reset:</strong> Email verification → Secure reset link → New password
          </div>
        </div>
      </div>
    </div>

    <!-- Login Component Modal -->
    <LoginComponent 
      v-if="showLoginModal"
      :initial-mode="loginMode"
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { getCurrentUser } from 'aws-amplify/auth'
import LoginComponent from '../components/LoginComponent.vue'

const router = useRouter()

// Reactive state
const showLoginModal = ref(false)
const loginMode = ref('signin')
const successMessage = ref('')

// Methods
function showLogin(mode) {
  loginMode.value = mode
  showLoginModal.value = true
}

async function handleLoginSuccess(data) {
  showLoginModal.value = false
  successMessage.value = `${data.type === 'signup' ? 'Account created' : 'Signed in'} successfully!`
  
  // Check if user is admin and redirect accordingly
  if (data.type === 'signin') {
    try {
      const user = await getCurrentUser()
      const isAdmin = user?.signInDetails?.loginId === 'admin@techjavelin.com'
      
      if (isAdmin) {
        setTimeout(() => {
          router.push('/admin')
        }, 1000)
        return
      }
    } catch (error) {
      console.warn('Could not check user status:', error)
    }
    
    // Regular user - redirect to home
    setTimeout(() => {
      router.push('/')
    }, 1000)
  }
  
  // Clear success message after 5 seconds
  setTimeout(() => {
    successMessage.value = ''
  }, 5000)
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, var(--bg-gradient-start), var(--bg-gradient-end));
  padding: 2rem 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-page-content {
  max-width: 1200px;
  width: 100%;
  display: grid;
  grid-template-columns: 1fr;
  gap: 3rem;
  align-items: start;
}

/* Hero Section */
.login-hero {
  text-align: center;
  color: white;
}

.login-hero h1 {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(45deg, var(--primary-color), var(--accent-color));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  opacity: 0.9;
  line-height: 1.6;
}

.hero-features {
  display: flex;
  justify-content: center;
  gap: 2rem;
  flex-wrap: wrap;
  margin-bottom: 3rem;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  padding: 0.75rem 1.25rem;
  border-radius: 25px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-icon {
  width: 20px;
  height: 20px;
  color: var(--accent-color);
}

/* Demo Section */
.login-demo-section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  color: white;
}

.login-demo-section h2 {
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.login-demo-section p {
  font-size: 1.1rem;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.demo-buttons {
  display: flex;
  gap: 1.5rem;
  justify-content: center;
  margin-bottom: 3rem;
  flex-wrap: wrap;
}

.demo-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  min-width: 160px;
  justify-content: center;
}

.demo-button svg {
  width: 20px;
  height: 20px;
}

.signin-demo {
  background: linear-gradient(135deg, var(--primary-color), #4F46E5);
  color: white;
}

.signin-demo:hover {
  background: linear-gradient(135deg, #4F46E5, var(--primary-color));
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(99, 102, 241, 0.3);
}

.signup-demo {
  background: linear-gradient(135deg, var(--accent-color), #F59E0B);
  color: white;
}

.signup-demo:hover {
  background: linear-gradient(135deg, #F59E0B, var(--accent-color));
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(245, 158, 11, 0.3);
}

/* Demo Info */
.demo-info h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--accent-color);
}

.feature-list {
  list-style: none;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 0.75rem;
  text-align: left;
}

.feature-list li {
  padding: 0.5rem 0;
  font-size: 1rem;
  opacity: 0.9;
}

/* Integration Info */
.integration-info {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  padding: 2.5rem;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
}

.integration-info h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.integration-info p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.9;
}

.auth-flows {
  display: grid;
  gap: 1rem;
}

.flow-item {
  background: rgba(255, 255, 255, 0.05);
  padding: 1.25rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.flow-item strong {
  color: var(--accent-color);
  display: block;
  margin-bottom: 0.5rem;
}

/* Success Message */
.success-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #10B981, #059669);
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
  z-index: 1000;
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive Design */
@media (min-width: 768px) {
  .login-page-content {
    grid-template-columns: 1fr 1fr;
    gap: 4rem;
  }
  
  .login-hero {
    text-align: left;
  }
  
  .hero-features {
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 1rem;
  }
  
  .login-hero h1 {
    font-size: 2rem;
  }
  
  .hero-subtitle {
    font-size: 1rem;
  }
  
  .hero-features {
    gap: 1rem;
  }
  
  .feature-item {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .login-demo-section,
  .integration-info {
    padding: 1.5rem;
  }
  
  .demo-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .demo-button {
    width: 100%;
    max-width: 280px;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .login-page {
    background: linear-gradient(135deg, #0F172A, #1E293B);
  }
}
</style>
