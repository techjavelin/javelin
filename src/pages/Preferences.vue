<template>
  <div class="page-content">
    <h1>Preferences</h1>
    <p>Customize your application settings and preferences.</p>
    
    <div class="preferences-form">
      <div class="form-section">
        <h2>Display Settings</h2>
        <div class="preference-group">
          <label class="preference-label">Theme</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" value="light" v-model="preferences.theme" />
              <span>Light Mode</span>
            </label>
            <label class="radio-label">
              <input type="radio" value="dark" v-model="preferences.theme" />
              <span>Dark Mode</span>
            </label>
            <label class="radio-label">
              <input type="radio" value="auto" v-model="preferences.theme" />
              <span>Auto (System)</span>
            </label>
          </div>
        </div>
        
        <div class="preference-group">
          <label class="preference-label">Language</label>
          <select v-model="preferences.language">
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
            <option value="de">German</option>
          </select>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Notification Preferences</h2>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.emailNotifications" />
            <span>Email notifications</span>
          </label>
        </div>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.pushNotifications" />
            <span>Push notifications</span>
          </label>
        </div>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.marketingEmails" />
            <span>Marketing emails</span>
          </label>
        </div>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.weeklyDigest" />
            <span>Weekly digest emails</span>
          </label>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Privacy Settings</h2>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.profilePublic" />
            <span>Make profile public</span>
          </label>
        </div>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.analyticsOptOut" />
            <span>Opt out of analytics tracking</span>
          </label>
        </div>
        <div class="preference-group">
          <label class="checkbox-label">
            <input type="checkbox" v-model="preferences.shareUsageData" />
            <span>Share anonymous usage data to improve the service</span>
          </label>
        </div>
      </div>
      
      <div class="form-section">
        <h2>Data Management</h2>
        <div class="preference-group">
          <button type="button" class="btn-secondary" @click="exportData">Export My Data</button>
          <p class="help-text">Download a copy of all your data in JSON format</p>
        </div>
        <div class="preference-group">
          <button type="button" class="btn-danger" @click="deleteAccount">Delete Account</button>
          <p class="help-text">Permanently delete your account and all associated data</p>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-primary" @click="savePreferences">Save Preferences</button>
        <button type="button" class="btn-secondary" @click="resetPreferences">Reset to Defaults</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const preferences = ref({
  theme: 'light',
  language: 'en',
  emailNotifications: true,
  pushNotifications: false,
  marketingEmails: false,
  weeklyDigest: true,
  profilePublic: false,
  analyticsOptOut: false,
  shareUsageData: true
})

function savePreferences() {
  // Here you would save to your backend
  alert('Preferences saved successfully!')
}

function resetPreferences() {
  preferences.value = {
    theme: 'light',
    language: 'en',
    emailNotifications: true,
    pushNotifications: false,
    marketingEmails: false,
    weeklyDigest: true,
    profilePublic: false,
    analyticsOptOut: false,
    shareUsageData: true
  }
}

function exportData() {
  // Mock data export
  const data = {
    profile: { name: 'John Doe', email: 'john@example.com' },
    preferences: preferences.value,
    exportDate: new Date().toISOString()
  }
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-data-export.json'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function deleteAccount() {
  if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
    alert('Account deletion request submitted. You will receive a confirmation email.')
  }
}
</script>

<style scoped>
.page-content {
  padding: 2rem;
  text-align: center;
  min-height: auto;
  width: 100%;
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

.preferences-form {
  max-width: 800px;
  margin: 0 auto;
  text-align: left;
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 2px 16px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #eaf2fb;
}

.form-section:last-of-type {
  border-bottom: none;
  margin-bottom: 1rem;
}

.form-section h2 {
  color: #2566af;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
}

.preference-group {
  margin-bottom: 1.5rem;
}

.preference-label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.75rem;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  font-weight: normal;
  color: #555;
  cursor: pointer;
}

.radio-label input,
.checkbox-label input {
  margin-right: 0.75rem;
}

.preference-group select {
  width: 100%;
  max-width: 300px;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.preference-group select:focus {
  outline: none;
  border-color: #2566af;
}

.help-text {
  font-size: 0.85rem;
  color: #666;
  margin-top: 0.5rem;
  margin-bottom: 0;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding-top: 1rem;
}

.btn-primary {
  background: #2566af;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-primary:hover {
  background: #174a7c;
}

.btn-secondary {
  background: transparent;
  color: #2566af;
  border: 2px solid #2566af;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-secondary:hover {
  background: #2566af;
  color: white;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease;
}

.btn-danger:hover {
  background: #c82333;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .main-content h1 {
    font-size: 2rem;
  }
  
  .preferences-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
  
  .radio-group {
    gap: 0.75rem;
  }
}
</style>
