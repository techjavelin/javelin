<template>
  <nav ref="navRef" class="main-nav">
    <router-link to="/" class="nav-link">Home</router-link>
    <router-link to="/about" class="nav-link">About Us</router-link>
    
    <NavDropdown 
      ref="navDropdownRef"
      :items="servicesMenuItems"
      label="Services"
      to="/services"
      mode="both"
    />
    <NavDropdown
      :items="solutionsMenuItems"
      label="Solutions"
      to="/javelin-pulse"
      mode="both"
    />
    
  <router-link to="/blog" class="nav-link">Blog</router-link>

    <span class="nav-search">🔍</span>
  <SocialIcons />
    <ThemeSwitcher :theme="theme" @toggle-theme="onThemeSwitch" />
    
    <!-- User Context Menu -->
    <div class="user-menu-container" @click.stop="toggleUserMenu" @keydown.enter.space="toggleUserMenu" tabindex="0" aria-haspopup="true" :aria-expanded="userMenuOpen">
      <div class="user-avatar">
        <svg class="user-icon" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <div class="user-submenu" v-if="userMenuOpen">
        <div v-if="!isLoggedIn" class="user-menu-section">
          <a @click="showLoginModal = true" class="user-menu-item">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11,7L9.6,8.4l2.6,2.6H2v2h10.2l-2.6,2.6L11,17l5-5L11,7z M20,19h-8v2h8c1.1,0,2-0.9,2-2V5c0-1.1-0.9-2-2-2h-8v2h8V19z"/>
            </svg>
            Login / Sign Up
          </a>
        </div>
        <div v-if="isLoggedIn && user" class="user-menu-section">
          <div class="user-info">
            <div class="user-name">{{ user.signInDetails?.loginId || user.username }}</div>
            <div class="user-email">{{ user.signInDetails?.loginId || user.username }}</div>
          </div>
          <router-link to="/profile" class="user-menu-item" @click="userMenuOpen = false">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,4A4,4 0 0,1 16,8A4,4 0 0,1 12,12A4,4 0 0,1 8,8A4,4 0 0,1 12,4M12,14C16.42,14 20,15.79 20,18V20H4V18C4,15.79 7.58,14 12,14Z"/>
            </svg>
            Edit Profile
          </router-link>
          <div>
            <router-link to="/preferences" class="user-menu-item" @click="userMenuOpen = false">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
              </svg>
              Preferences
            </router-link>
          </div>
          <div>
            <router-link to="/pulse" class="user-menu-item" @click="userMenuOpen = false">
              <svg class="menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:0.75em;min-width:1.25em;">
                <polyline points="3 12 6 12 9 21 15 3 18 12 21 12" />
              </svg>
              <span>Pulse Platform</span>
            </router-link>
          </div>
          <router-link v-if="isAdminUser" to="/admin" class="user-menu-item admin-link" @click="userMenuOpen = false">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12,15.5A3.5,3.5 0 0,1 8.5,12A3.5,3.5 0 0,1 12,8.5A3.5,3.5 0 0,1 15.5,12A3.5,3.5 0 0,1 12,15.5M19.43,12.97C19.47,12.65 19.5,12.33 19.5,12C19.5,11.67 19.47,11.34 19.43,11.03L21.54,9.37C21.73,9.22 21.78,8.95 21.66,8.73L19.66,5.27C19.54,5.05 19.27,4.96 19.05,5.05L16.56,6.05C16.04,5.66 15.5,5.32 14.87,5.07L14.5,2.42C14.46,2.18 14.25,2 14,2H10C9.75,2 9.54,2.18 9.5,2.42L9.13,5.07C8.5,5.32 7.96,5.66 7.44,6.05L4.95,5.05C4.73,4.96 4.46,5.05 4.34,5.27L2.34,8.73C2.22,8.95 2.27,9.22 2.46,9.37L4.57,11.03C4.53,11.34 4.5,11.67 4.5,12C4.5,12.33 4.53,12.65 4.57,12.97L2.46,14.63C2.27,14.78 2.22,15.05 2.34,15.27L4.34,18.73C4.46,18.95 4.73,19.03 4.95,18.95L7.44,17.94C7.96,18.34 8.5,18.68 9.13,18.93L9.5,21.58C9.54,21.82 9.75,22 10,22H14C14.25,22 14.46,21.82 14.5,21.58L14.87,18.93C15.5,18.68 16.04,18.34 16.56,17.94L19.05,18.95C19.27,19.03 19.54,18.95 19.66,18.73L21.66,15.27C21.78,15.05 21.73,14.78 21.54,14.63L19.43,12.97Z"/>
            </svg>
            Pulse Admin
          </router-link>
        </div>
        <div class="user-menu-divider"></div>
        <div class="user-menu-section">
          <a @click="toggleTheme" class="user-menu-item">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor" v-if="theme === 'light'">
              <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.4 6.35,17.41C9.37,20.43 14,20.54 17.33,17.97Z"/>
            </svg>
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor" v-else>
              <path d="M12,8A4,4 0 0,0 8,12A4,4 0 0,0 12,16A4,4 0 0,0 16,12A4,4 0 0,0 12,8M12,18A6,6 0 0,1 6,12A6,6 0 0,1 12,6A6,6 0 0,1 18,12A6,6 0 0,1 12,18M20,8.69V4H15.31L12,0.69L8.69,4H4V8.69L0.69,12L4,15.31V20H8.69L12,23.31L15.31,20H20V15.31L23.31,12L20,8.69Z"/>
            </svg>
            {{ theme === 'light' ? 'Dark Mode' : 'Light Mode' }}
          </a>
          <div v-if="isLoggedIn && user" class="user-menu-divider"></div>
          <a v-if="isLoggedIn && user" @click="handleLogout" class="user-menu-item">
            <svg class="menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/>
            </svg>
            Logout
          </a>
        </div>
      </div>
    </div>
    
    <!-- Custom Login Modal -->
    <LoginComponent 
      v-if="showLoginModal"
      @close="showLoginModal = false"
      @success="handleLoginSuccess"
    />
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import NavDropdown from './NavDropdown.vue'
import LoginComponent from './LoginComponent.vue'
import ThemeSwitcher from './ThemeSwitcher.vue'
import SocialIcons from './SocialIcons.vue'

// Props for user data and theme
const props = defineProps({
  theme: {
    type: String,
    default: 'light'
  },
  isLoggedIn: {
    type: Boolean,
    default: false
  },
  user: {
    type: Object,
    default: null
  }
})

// Emits for parent component
const emit = defineEmits(['toggle-theme', 'logout', 'login-success'])

// Theme switcher handler
function onThemeSwitch(val) {
  emit('toggle-theme', val)
}

// Local state
const userMenuOpen = ref(false)
const showLoginModal = ref(false)
const navRef = ref(null)
const navDropdownRef = ref(null)

// Handle click outside
function handleClickOutside(event) {
  // Close user menu if clicking outside
  if (navRef.value && !navRef.value.contains(event.target)) {
    userMenuOpen.value = false
    showLoginModal.value = false
  }
}

// Setup click outside listener
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// Computed properties
const isAdminUser = computed(() => {
  return props.isLoggedIn && 
         props.user?.signInDetails?.loginId === 'admin@techjavelin.com'
})

// Services menu configuration
const servicesMenuItems = [
  { label: 'Program Management', to: '/services#program-management' },
  { label: 'Managed IT Services', to: '/services#managed-it' },
  { label: 'Technology Strategy', to: '/services#strategy' },
  { label: 'Fractional Leadership', to: '/services#leadership' }
]

// Solutions menu configuration
const solutionsMenuItems = [
  { label: 'Javelin Pulse', to: '/javelin-pulse' }
]

// Methods
function toggleUserMenu() {
  userMenuOpen.value = !userMenuOpen.value
}

function toggleTheme() {
  emit('toggle-theme')
  userMenuOpen.value = false
}

function handleLogout() {
  emit('logout')
  userMenuOpen.value = false
}

async function handleLoginSuccess(data) {
  showLoginModal.value = false
  userMenuOpen.value = false
  // Import getCurrentUser to get the updated user data
  try {
    const { getCurrentUser } = await import('aws-amplify/auth')
    const user = await getCurrentUser()
    emit('login-success', user)
  } catch (error) {
    console.error('Error getting user after login:', error)
  }
}

// Expose methods for parent component
defineExpose({
  closeUserMenu: () => {
    userMenuOpen.value = false
    showLoginModal.value = false
  },
  closeAllMenus: () => {
    userMenuOpen.value = false
    showLoginModal.value = false
    if (navDropdownRef.value) {
      navDropdownRef.value.closeDropdown()
    }
  }
})
</script>

<style scoped>
/* Main navigation */
.main-nav {
  background: transparent;
  padding: 0.5rem 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  border-bottom: 1px solid transparent;
}

.theme-switcher {
  display: flex;
  align-items: center;
  margin-left: 1rem;
}
.theme-switcher .fa {
  font-size: 1.2rem;
  margin: 0 0.2rem;
  vertical-align: middle;
}

.nav-link {
  color: #2566af;
  text-decoration: none;
  font-weight: 500;
  padding: 0.3rem 0.5rem;
  position: relative;
  font-size: 0.9rem;
  line-height: 1.2;
  transition: color .25s ease;
}
.nav-link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  transition: width .25s ease;
}
.nav-link:hover::after, .nav-link:focus-visible::after, .router-link-active.nav-link::after {
  width: 100%;
}

.nav-search {
  margin-left: auto;
  color: #2566af;
  cursor: pointer;
  font-size: 1rem;
}

/* User Menu styles */
.user-menu-container {
  position: relative;
  cursor: pointer;
  margin-left: 1rem;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.user-avatar:hover {
  background: #2566af;
}

.user-icon {
  width: 24px;
  height: 24px;
  color: white;
}

.user-submenu {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: #fff;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  border-radius: 8px;
  min-width: 220px;
  z-index: 1000;
  padding: 0.5rem 0;
  border: 1px solid #e0e0e0;
}

.user-menu-section {
  padding: 0.25rem 0;
}

.user-info {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 0.25rem;
}

.user-name {
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.user-email {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.2rem;
}

.user-menu-item {
  display: flex;
  align-items: center;
  padding: 0.6rem 1rem;
  color: #666;
  text-decoration: none;
  font-size: 0.9rem;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  background: none;
  width: 100%;
  text-align: left;
}
.user-menu-section {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  align-items: stretch;
}
.user-menu-item {
  display: flex;
  align-items: center;
  padding: 0.5rem 1.25rem;
  color: #222;
  text-decoration: none;
  font-size: 0.92rem;
  transition: background 0.2s, color 0.2s;
  border-radius: 6px;
  font-weight: 500;
  background: none;
  margin: 0;
}
.user-menu-item:hover {
  background: #f0f4fa;
  color: #1a73e8;
}
.user-menu-item .menu-icon {
  margin-right: 0.75em;
  min-width: 1.25em;
}

.user-menu-item:hover {
  background: #f8f9fa;
  color: #2566af;
}

.menu-icon {
  width: 16px;
  height: 16px;
  margin-right: 0.75rem;
  color: currentColor;
}

.user-menu-divider {
  height: 1px;
  background: #e0e0e0;
  margin: 0.25rem 0;
}

/* Responsive design */
@media (max-width: 768px) {
  .user-submenu {
    right: -1rem;
    min-width: 200px;
  }
  
  .main-nav {
    padding: 0.75rem 1rem;
  }
}

/* Dark mode styles */
[data-theme="dark"] .main-nav {
  background: #1a1a1a;
  border-bottom-color: #333;
}

[data-theme="dark"] .nav-link {
  color: #e0e0e0;
}

[data-theme="dark"] .nav-link:hover {
  background: transparent;
  color: #64b5f6;
}

[data-theme="dark"] .nav-search {
  color: #64b5f6;
}

[data-theme="dark"] .user-avatar {
  background: transparent;
}

[data-theme="dark"] .user-submenu {
  background: #2d2d2d;
  border-color: #404040;
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
}

[data-theme="dark"] .user-info {
  border-bottom-color: #404040;
}

[data-theme="dark"] .user-name {
  color: #e0e0e0;
}

[data-theme="dark"] .user-email {
  color: #c0c0c0;
}

[data-theme="dark"] .user-menu-item {
  color: #c0c0c0;
}

[data-theme="dark"] .user-menu-item:hover {
  background: #404040;
  color: #64b5f6;
}

[data-theme="dark"] .user-menu-divider {
  background: #404040;
}

/* Admin link styling */
.admin-link {
  background: linear-gradient(135deg, #2566af, #3b82f6) !important;
  color: white !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
  margin: 0.25rem 0 !important;
}

.admin-link:hover {
  background: linear-gradient(135deg, #1a4d87, #2563eb) !important;
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(37, 102, 175, 0.3);
}

[data-theme="dark"] .admin-link {
  background: linear-gradient(135deg, #3b82f6, #6366f1) !important;
}

[data-theme="dark"] .admin-link:hover {
  background: linear-gradient(135deg, #2563eb, #4f46e5) !important;
}
</style>
