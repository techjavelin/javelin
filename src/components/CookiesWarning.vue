<template>
  <div v-if="showBanner" class="cookies-banner">
    <div class="cookies-content">
      <div class="cookies-text">
        <div class="cookies-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,3A9,9 0 0,0 3,12A9,9 0 0,0 12,21A9,9 0 0,0 21,12C21,11.5 20.96,11 20.87,10.5C20.6,10.62 20.31,10.68 20,10.68C18.29,10.68 16.9,9.29 16.9,7.58C16.9,7.31 16.96,7.05 17.07,6.81C17.16,6.55 17.29,6.31 17.46,6.1C17.85,5.69 18.39,5.44 19,5.44C19.13,5.44 19.26,5.46 19.38,5.5C17.98,4.24 16.12,3.5 14.06,3.91C13.18,3.37 12.11,3 11,3C10.87,3 10.74,3 10.61,3.05C11.19,3.56 11.7,4.19 12.07,4.81C12.54,5.61 12.8,6.44 12.80,7.27C12.8,8.78 11.58,10 10.07,10C9.5,10 8.95,9.75 8.54,9.35C7.5,9.9 6.69,10.76 6.21,11.8C6.11,12 6.04,12.24 6,12.5C6,12.62 6,12.74 6,12.87C6.08,14.65 6.85,16.23 8.06,17.32C8.41,17.58 8.8,17.8 9.22,17.97C10.04,18.27 10.94,18.44 11.88,18.44C15.28,18.44 18.07,15.64 18.07,12.24C18.07,11.39 17.88,10.59 17.54,9.86C17.92,10.11 18.37,10.24 18.85,10.24C19.56,10.24 20.2,9.89 20.61,9.33C20.87,8.87 21,8.33 21,7.76C21,6.28 19.72,5 18.24,5C17.38,5 16.62,5.41 16.15,6.05C15.18,4.23 13.24,3 11,3M8.5,11A1.5,1.5 0 0,1 10,12.5A1.5,1.5 0 0,1 8.5,14A1.5,1.5 0 0,1 7,12.5A1.5,1.5 0 0,1 8.5,11M15.5,15A1.5,1.5 0 0,1 17,16.5A1.5,1.5 0 0,1 15.5,18A1.5,1.5 0 0,1 14,16.5A1.5,1.5 0 0,1 15.5,15Z"/>
          </svg>
        </div>
        <div class="cookies-message">
          <h4>We use cookies</h4>
          <p>
            We use cookies to enhance your browsing experience, serve personalized ads or content, 
            and analyze our traffic. By clicking "Accept All", you consent to our use of cookies.
            <router-link to="/cookies-policy" class="cookies-link">Read our Cookie Policy</router-link>
          </p>
        </div>
      </div>
      
      <div class="cookies-actions">
        <button @click="acceptEssential" class="cookies-btn cookies-btn-secondary">
          Essential Only
        </button>
        <button @click="acceptAll" class="cookies-btn cookies-btn-primary">
          Accept All
        </button>
        <button @click="showSettings = !showSettings" class="cookies-btn cookies-btn-settings">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- Cookie Settings Panel -->
    <div v-if="showSettings" class="cookies-settings">
      <div class="settings-header">
        <h4>Cookie Preferences</h4>
        <button @click="showSettings = false" class="settings-close">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z"/>
          </svg>
        </button>
      </div>
      
      <div class="settings-content">
        <div class="cookie-category">
          <div class="category-header">
            <div class="category-info">
              <h5>Essential Cookies</h5>
              <p>Required for basic website functionality</p>
            </div>
            <div class="category-toggle">
              <input type="checkbox" id="essential" checked disabled>
              <label for="essential">Always On</label>
            </div>
          </div>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <div class="category-info">
              <h5>Analytics Cookies</h5>
              <p>Help us understand how visitors interact with our website</p>
            </div>
            <div class="category-toggle">
              <input type="checkbox" id="analytics" v-model="preferences.analytics">
              <label for="analytics">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <div class="category-info">
              <h5>Marketing Cookies</h5>
              <p>Used to deliver relevant advertisements and track ad performance</p>
            </div>
            <div class="category-toggle">
              <input type="checkbox" id="marketing" v-model="preferences.marketing">
              <label for="marketing">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div class="cookie-category">
          <div class="category-header">
            <div class="category-info">
              <h5>Functional Cookies</h5>
              <p>Enable enhanced functionality and personalization (theme preferences, language settings, etc.)</p>
            </div>
            <div class="category-toggle">
              <input type="checkbox" id="functional" v-model="preferences.functional">
              <label for="functional">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
          <div v-if="preferences.functional" class="category-details">
            <div class="detail-item">
              <span class="detail-label">Theme Preferences:</span>
              <span class="detail-value">Stores your light/dark mode choice</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">UI Customization:</span>
              <span class="detail-value">Remembers layout and display preferences</span>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-actions">
        <button @click="savePreferences" class="cookies-btn cookies-btn-primary">
          Save Preferences
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'

// Local state
const showBanner = ref(false)
const showSettings = ref(false)

// Cookie preferences
const preferences = reactive({
  essential: true, // Always true
  analytics: false,
  marketing: false,
  functional: false
})

// Check if user has already made cookie choice
onMounted(() => {
  const cookieConsent = localStorage.getItem('cookie-consent')
  if (!cookieConsent) {
    // No consent given yet - disable theme storage
    window.themeStorageAllowed = false
    
    // Show banner after a short delay for better UX
    setTimeout(() => {
      showBanner.value = true
    }, 1000)
  } else {
    // Load existing preferences
    try {
      const savedPreferences = JSON.parse(cookieConsent)
      Object.assign(preferences, savedPreferences)
      
      // Apply cookie settings including theme storage
      loadCookies(savedPreferences)
    } catch (error) {
      console.error('Error parsing cookie preferences:', error)
      window.themeStorageAllowed = false
    }
  }
})

// Accept all cookies
function acceptAll() {
  preferences.analytics = true
  preferences.marketing = true
  preferences.functional = true
  saveConsentChoice()
}

// Accept only essential cookies
function acceptEssential() {
  preferences.analytics = false
  preferences.marketing = false
  preferences.functional = false
  saveConsentChoice()
}

// Save custom preferences
function savePreferences() {
  saveConsentChoice()
  showSettings.value = false
}

// Save consent choice to localStorage and hide banner
function saveConsentChoice() {
  const consentData = {
    essential: true,
    analytics: preferences.analytics,
    marketing: preferences.marketing,
    functional: preferences.functional,
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem('cookie-consent', JSON.stringify(consentData))
  showBanner.value = false
  
  // Trigger cookie loading based on preferences
  loadCookies(consentData)
  
  // Emit event for parent components if needed
  window.dispatchEvent(new CustomEvent('cookie-consent-updated', { 
    detail: consentData 
  }))
}

// Load appropriate cookies based on consent
function loadCookies(consent) {
  if (consent.analytics) {
    // Load Google Analytics or other analytics scripts
    console.log('Loading analytics cookies')
    // Example: gtag('consent', 'update', { analytics_storage: 'granted' })
  }
  
  if (consent.marketing) {
    // Load marketing/advertising scripts
    console.log('Loading marketing cookies')
    // Example: Load Facebook Pixel, Google Ads, etc.
  }
  
  if (consent.functional) {
    // Load functional cookies including theme preferences
    console.log('Loading functional cookies including theme preferences')
    // Allow theme storage and other UI preferences
    enableThemeStorage()
  } else {
    // Disable theme storage if functional cookies not accepted
    disableThemeStorage()
  }
}

// Theme storage management
function enableThemeStorage() {
  // Allow theme preferences to be stored
  window.themeStorageAllowed = true
  
  // If there's a pending theme change, apply it now
  const pendingTheme = sessionStorage.getItem('pending-theme')
  if (pendingTheme) {
    localStorage.setItem('user-theme', pendingTheme)
    document.documentElement.setAttribute('data-theme', pendingTheme)
    sessionStorage.removeItem('pending-theme')
    
    // Notify app of theme change
    window.dispatchEvent(new CustomEvent('theme-storage-enabled', {
      detail: { theme: pendingTheme }
    }))
  }
}

function disableThemeStorage() {
  // Remove theme storage permission
  window.themeStorageAllowed = false
  
  // Clear any stored theme preferences
  localStorage.removeItem('user-theme')
  
  // Reset to system default
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', systemTheme)
  
  // Notify app
  window.dispatchEvent(new CustomEvent('theme-storage-disabled', {
    detail: { theme: systemTheme }
  }))
}

// Expose method to show banner again (for settings page)
defineExpose({
  showBanner: () => {
    showBanner.value = true
  },
  getConsent: () => {
    const consent = localStorage.getItem('cookie-consent')
    return consent ? JSON.parse(consent) : null
  }
})
</script>

<style scoped>
.cookies-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.cookies-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
  gap: 2rem;
}

.cookies-text {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.cookies-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  color: var(--primary-color);
  background: rgba(99, 102, 241, 0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cookies-icon svg {
  width: 24px;
  height: 24px;
}

.cookies-message h4 {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.cookies-message p {
  font-size: 0.9rem;
  line-height: 1.5;
  color: #666;
  margin: 0;
}

.cookies-link {
  color: var(--primary-color);
  text-decoration: underline;
  margin-left: 0.5rem;
}

.cookies-link:hover {
  color: var(--accent-color);
}

.cookies-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.cookies-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.cookies-btn-primary {
  background: linear-gradient(135deg, var(--primary-color), #4F46E5);
  color: white;
}

.cookies-btn-primary:hover {
  background: linear-gradient(135deg, #4F46E5, var(--primary-color));
  transform: translateY(-1px);
}

.cookies-btn-secondary {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.cookies-btn-secondary:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.cookies-btn-settings {
  background: #fff;
  color: #6b7280;
  border: 1px solid #d1d5db;
  padding: 0.75rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cookies-btn-settings:hover {
  background: #f9fafb;
  color: var(--primary-color);
}

.cookies-btn-settings svg {
  width: 18px;
  height: 18px;
}

/* Cookie Settings Panel */
.cookies-settings {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  background: #fafafa;
  animation: expandDown 0.3s ease-out;
}

@keyframes expandDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 500px;
    opacity: 1;
  }
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.settings-header h4 {
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.settings-close {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.settings-close:hover {
  background: #e5e7eb;
  color: #374151;
}

.settings-close svg {
  width: 20px;
  height: 20px;
}

.settings-content {
  padding: 0 2rem;
  max-height: 300px;
  overflow-y: auto;
}

.cookie-category {
  padding: 1rem 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.cookie-category:last-child {
  border-bottom: none;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.category-info h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 0.25rem 0;
}

.category-info p {
  font-size: 0.85rem;
  color: #6b7280;
  margin: 0;
  line-height: 1.4;
}

.category-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.category-toggle input[type="checkbox"] {
  position: relative;
  width: 40px;
  height: 20px;
  appearance: none;
  background: #d1d5db;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-toggle input[type="checkbox"]:checked {
  background: var(--primary-color);
}

.category-toggle input[type="checkbox"]:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.category-toggle input[type="checkbox"]:before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.category-toggle input[type="checkbox"]:checked:before {
  transform: translateX(20px);
}

.category-toggle label {
  font-size: 0.8rem;
  color: #6b7280;
  cursor: pointer;
}

.category-details {
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(99, 102, 241, 0.1);
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
  font-size: 0.8rem;
}

.detail-item:not(:last-child) {
  border-bottom: 1px solid rgba(99, 102, 241, 0.1);
  margin-bottom: 0.25rem;
  padding-bottom: 0.5rem;
}

.detail-label {
  font-weight: 600;
  color: #4f46e5;
}

.detail-value {
  color: #6b7280;
  text-align: right;
  max-width: 60%;
}

.settings-actions {
  padding: 1rem 2rem;
  display: flex;
  justify-content: flex-end;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cookies-content {
    flex-direction: column;
    align-items: stretch;
    text-align: center;
    gap: 1.5rem;
    padding: 1.25rem 1rem;
  }

  .cookies-text {
    align-items: center;
    text-align: center;
  }

  .cookies-actions {
    justify-content: center;
    flex-wrap: wrap;
  }

  .cookies-btn {
    flex: 1;
    min-width: 120px;
  }

  .settings-header,
  .settings-content,
  .settings-actions {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .category-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .cookies-banner {
    background: rgba(31, 41, 55, 0.98);
    border-top-color: rgba(255, 255, 255, 0.1);
  }

  .cookies-message h4 {
    color: #f9fafb;
  }

  .cookies-message p {
    color: #d1d5db;
  }

  .cookies-settings {
    background: #374151;
  }

  .settings-header h4 {
    color: #f9fafb;
  }

  .category-info h5 {
    color: #f9fafb;
  }

  .category-info p {
    color: #9ca3af;
  }
}
</style>
