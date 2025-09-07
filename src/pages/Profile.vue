<template>
  <PageWrapper>
    <h1>User Profile</h1>
    <p>Manage your profile information and account settings.</p>
    
    <div class="profile-form">
      <div class="form-section">
        <h2>Personal Information</h2>
        <div class="form-group">
          <label for="name">Full Name</label>
          <input type="text" id="name" v-model="profile.name" />
        </div>
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" v-model="profile.email" />
        </div>
        <div class="form-group">
          <label for="company">Company</label>
          <input type="text" id="company" v-model="profile.company" />
        </div>
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" v-model="profile.phone" />
        </div>
      </div>
      
      <div class="form-section">
        <h2>Account Settings</h2>
        <div class="form-group">
          <label for="timezone">Timezone</label>
          <select id="timezone" v-model="profile.timezone">
            <option value="America/New_York">Eastern Time</option>
            <option value="America/Chicago">Central Time</option>
            <option value="America/Denver">Mountain Time</option>
            <option value="America/Los_Angeles">Pacific Time</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
        <div class="form-group">
          <label>
            <input type="checkbox" v-model="profile.emailNotifications" />
            Receive email notifications
          </label>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-primary" @click="saveProfile">Save Changes</button>
        <button type="button" class="btn-secondary" @click="resetProfile">Reset</button>
      </div>
    </div>
  </PageWrapper>
</template>

<script setup>
import { ref } from 'vue'
const profile = ref({
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Tech Corp',
  phone: '+1 (555) 123-4567',
  timezone: 'America/New_York',
  emailNotifications: true
})

function saveProfile() {
  // Here you would save to your backend
  alert('Profile saved successfully!')
}

function resetProfile() {
  // Reset to original values
  profile.value = {
    name: 'John Doe',
    email: 'john@example.com',
    company: 'Tech Corp',
    phone: '+1 (555) 123-4567',
    timezone: 'America/New_York',
    emailNotifications: true
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

.profile-form {
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

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  font-weight: 600;
  color: #333;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #2566af;
}

.form-group input[type="checkbox"] {
  width: auto;
  margin-right: 0.5rem;
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

@media (max-width: 768px) {
  .main-content {
    padding: 1rem;
  }
  
  .main-content h1 {
    font-size: 2rem;
  }
  
  .profile-form {
    padding: 1.5rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>
