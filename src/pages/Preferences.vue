<template>
  <PageWrapper>
    <div class="main-content">
      <h1>Preferences</h1>
      <p>Customize your experience and manage your privacy settings.</p>
      
      <!-- Theme Selection Section -->
      <div class="preference-section">
        <h2>Appearance</h2>
        <div class="preference-item">
          <label class="preference-label">
            <span class="label-text">Theme</span>
            <span class="label-description">Choose your preferred color scheme</span>
          </label>
          <div class="theme-options">
            <button 
              @click="setTheme('light')" 
              :class="['theme-option', { active: currentTheme === 'light' }]"
              aria-label="Light theme"
            >
              <div class="theme-preview light"></div>
              <span>Light</span>
            </button>
            <button 
              @click="setTheme('dark')" 
              :class="['theme-option', { active: currentTheme === 'dark' }]"
              aria-label="Dark theme"
            >
              <div class="theme-preview dark"></div>
              <span>Dark</span>
            </button>
            <button 
              @click="setTheme('auto')" 
              :class="['theme-option', { active: currentTheme === 'auto' }]"
              aria-label="Auto theme (follows system preference)"
            >
              <div class="theme-preview auto"></div>
              <span>Auto</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Cookie Compliance Section -->
      <div class="preference-section">
        <h2>Privacy & Cookies</h2>
        <div class="preference-item">
          <label class="preference-label">
            <span class="label-text">Cookie Preferences</span>
            <span class="label-description">Manage how we use cookies and store your preferences</span>
          </label>
          <div class="cookie-info">
            <div class="info-card">
              <h3>Current Settings</h3>
              <div class="cookie-status">
                <div class="status-item">
                  <span class="status-label">Essential Cookies:</span>
                  <span class="status-value enabled">Always Enabled</span>
                </div>
                <div class="status-item">
                  <span class="status-label">Analytics Cookies:</span>
                  <span :class="['status-value', cookieConsent.analytics ? 'enabled' : 'disabled']">
                    {{ cookieConsent.analytics ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <div class="status-item">
                  <span class="status-label">Marketing Cookies:</span>
                  <span :class="['status-value', cookieConsent.marketing ? 'enabled' : 'disabled']">
                    {{ cookieConsent.marketing ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
                <div class="status-item">
                  <span class="status-label">Functional Cookies:</span>
                  <span :class="['status-value', cookieConsent.functional ? 'enabled' : 'disabled']">
                    {{ cookieConsent.functional ? 'Enabled' : 'Disabled' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const currentTheme = ref('light')
const cookieConsent = ref({
  essential: true,
  analytics: false,
  marketing: false,
  functional: false
})

const setTheme = (theme) => {
  currentTheme.value = theme
  const isDark = theme === 'dark' || (theme === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('cookieConsent')
    if (saved) {
      cookieConsent.value = { ...cookieConsent.value, ...JSON.parse(saved) }
    }
  } catch (e) {
    console.warn('Unable to load settings:', e)
  }
})
</script>

<style scoped>
.page-content {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

.page-content h1 {
  color: #2566af;
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.main-content > p {
  font-size: 1.2rem;
  color: #666;
  margin-bottom: 3rem;
  line-height: 1.6;
}

.preference-section {
  margin-bottom: 3rem;
  padding: 2rem;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 1px solid #e0e0e0;
}

.preference-section h2 {
  color: #2566af;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 0.5rem;
}

.label-text {
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
  display: block;
  margin-bottom: 0.25rem;
}

.label-description {
  color: #666;
  font-size: 0.9rem;
  display: block;
}

.theme-options {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-option.active {
  border-color: #2566af;
  background: #f8faff;
}

.theme-preview {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid #ddd;
}

.theme-preview.light {
  background: #fff;
}

.theme-preview.dark {
  background: #333;
}

.theme-preview.auto {
  background: linear-gradient(45deg, #fff 50%, #333 50%);
}

.info-card {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.info-card h3 {
  color: #2566af;
  margin-bottom: 1rem;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #e0e0e0;
}

.status-item:last-child {
  border-bottom: none;
}

.status-value.enabled {
  background: #d4edda;
  color: #155724;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

.status-value.disabled {
  background: #f8d7da;
  color: #721c24;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
}

/* Dark Mode */
[data-theme="dark"] .page-content h1 {
  color: #64b5f6;
}

[data-theme="dark"] .main-content > p {
  color: #c0c0c0;
}

[data-theme="dark"] .preference-section {
  background: #1e1e1e;
  border-color: #404040;
  color: #e0e0e0;
}

[data-theme="dark"] .preference-section h2 {
  color: #64b5f6;
  border-bottom-color: #404040;
}

[data-theme="dark"] .label-text {
  color: #e0e0e0;
}

[data-theme="dark"] .info-card {
  background: #2d2d2d;
  border-color: #444;
  color: #e0e0e0;
}

[data-theme="dark"] .info-card h3 {
  color: #64b5f6;
}
</style>