<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TopNav from './components/TopNav.vue'
import CookiesWarning from './components/CookiesWarning.vue'
import { getCurrentUser, signOut, type AuthUser } from 'aws-amplify/auth'
import '@aws-amplify/ui-vue/styles.css'

import { Amplify } from 'aws-amplify'
import outputs from '../amplify_outputs.json'

Amplify.configure(outputs)

// Authentication state
const currentUser = ref<AuthUser | null>(null)
const isLoggedIn = ref(false)

// Check authentication status on app load
onMounted(async () => {
  // Initialize theme management
  initializeTheme()
  setupCookieListeners()
  
  // Check authentication
  try {
    const user = await getCurrentUser()
    currentUser.value = user
    isLoggedIn.value = true
  } catch (error) {
    // User is not logged in
    currentUser.value = null
    isLoggedIn.value = false
  }
})

// Handle logout
async function handleLogout() {
  try {
    await signOut()
    currentUser.value = null
    isLoggedIn.value = false
  } catch (error) {
    console.error('Error signing out:', error)
  }
}

// Handle login success (called from TopNav when user logs in)
function handleLoginSuccess(user: AuthUser) {
  currentUser.value = user
  isLoggedIn.value = true
}

const route = useRoute()

const breadcrumb = computed(() => {
  // Remove leading slash, split, and filter empty
  const segments = route.path.replace(/^\//, '').split('/').filter(Boolean)
  return `~${segments.length ? '/' + segments.join('/') : ''}`
})

// Extend window interface for theme storage flag
declare global {
  interface Window {
    themeStorageAllowed: boolean;
  }
}

const theme = ref('light')

// Theme management with cookie compliance
function toggleTheme() {
  const newTheme = theme.value === 'light' ? 'dark' : 'light'
  setTheme(newTheme)
}

function setTheme(newTheme: string) {
  theme.value = newTheme
  document.documentElement.setAttribute('data-theme', newTheme)
  
  // Only store theme if functional cookies are allowed
  if (window.themeStorageAllowed) {
    localStorage.setItem('user-theme', newTheme)
  } else {
    // Store temporarily in session storage until consent is given
    sessionStorage.setItem('pending-theme', newTheme)
    
    // Show a subtle notification about cookie consent
    showThemeConsentNotice()
  }
}

function showThemeConsentNotice() {
  // Create a temporary notification
  const notification = document.createElement('div')
  notification.innerHTML = `
    <div style="
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(79, 70, 229, 0.95);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      z-index: 1001;
      backdrop-filter: blur(10px);
      animation: slideInRight 0.3s ease-out;
    ">
      <div style="display: flex; align-items: center; gap: 8px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"/>
        </svg>
        <span>Accept functional cookies to save theme preferences</span>
      </div>
    </div>
  `
  
  // Add CSS animation
  const style = document.createElement('style')
  style.textContent = `
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `
  document.head.appendChild(style)
  
  document.body.appendChild(notification)
  
  // Remove notification after 4 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove()
    }
  }, 4000)
}

// Initialize theme on app load
function initializeTheme() {
  // Check if functional cookies are allowed
  const cookieConsent = localStorage.getItem('cookie-consent')
  let functionalAllowed = false
  
  if (cookieConsent) {
    try {
      const consent = JSON.parse(cookieConsent)
      functionalAllowed = consent.functional
      window.themeStorageAllowed = functionalAllowed
    } catch (error) {
      console.error('Error parsing cookie consent:', error)
    }
  }
  
  if (functionalAllowed) {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('user-theme')
    if (savedTheme) {
      theme.value = savedTheme
    } else {
      // Default to system preference
      theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
  } else {
    // Use system preference without storing
    theme.value = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    window.themeStorageAllowed = false
  }
  
  document.documentElement.setAttribute('data-theme', theme.value)
}

// Listen for cookie consent changes
function setupCookieListeners() {
  window.addEventListener('theme-storage-enabled', (event: Event) => {
    // Theme storage was just enabled
    const customEvent = event as CustomEvent
    const newTheme = customEvent.detail.theme
    theme.value = newTheme
  })
  
  window.addEventListener('theme-storage-disabled', (event: Event) => {
    // Theme storage was disabled
    const customEvent = event as CustomEvent
    const systemTheme = customEvent.detail.theme
    theme.value = systemTheme
  })
  
  window.addEventListener('cookie-consent-updated', (event: Event) => {
    const customEvent = event as CustomEvent
    const consent = customEvent.detail
    window.themeStorageAllowed = consent.functional
    
    if (consent.functional) {
      // Functional cookies were just enabled
      const pendingTheme = sessionStorage.getItem('pending-theme')
      if (pendingTheme) {
        localStorage.setItem('user-theme', pendingTheme)
        sessionStorage.removeItem('pending-theme')
      } else {
        // Save current theme
        localStorage.setItem('user-theme', theme.value)
      }
    } else {
      // Functional cookies were disabled
      localStorage.removeItem('user-theme')
    }
  })
}

const topNavRef = ref<InstanceType<typeof TopNav> | null>(null)

// Close menus when clicking outside
function handleClickOutside() {
  if (topNavRef.value) {
    topNavRef.value.closeAllMenus()
  }
}
</script>

<template>
  <div class="javelin-app" @click="handleClickOutside">
    <!-- Top blue bar: only show on main site -->
    <div v-if="!route.meta.hideTopNav" class="top-bar">
      <span>Sign-up for updates now!</span>
      <input type="email" placeholder="Your email address..." class="newsletter-input" />
      <button class="newsletter-btn">Subscribe</button>
    </div>
    <!-- Logo and social row -->
    <div class="logo-social-row">
      <img src="https://techjavelin.com/wp-content/uploads/2022/10/cropped-Tech-Javelin-Ltd-logos_transparent.png" alt="Tech Javelin Logo" class="logo-img" />
      <span class="logo-title">Tech Javelin</span>
      <div class="social-icons">
        <a href="https://discord.gg/3y2vAHDWVz" aria-label="Discord">
          <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
          </svg>
        </a>
        <a href="https://twitter.com/techjavelin" aria-label="Twitter">
          <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
        </a>
        <a href="https://www.linkedin.com/in/chrisschmidt/" aria-label="LinkedIn">
          <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <a href="https://github.com/tech-javelin" aria-label="GitHub">
          <svg class="social-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  <!-- Navigation bar: only show for non-dashboard routes -->
  <TopNav
    v-if="!route.meta.hideTopNav"
    ref="topNavRef"
    :theme="theme"
    :is-logged-in="isLoggedIn"
    :user="currentUser"
    @toggle-theme="toggleTheme"
    @logout="handleLogout"
    @login-success="handleLoginSuccess"
  />
    <!-- Main content area for routed components -->
    <router-view></router-view>
    <!-- Footer -->
    <footer class="site-footer">
      <div class="footer-content">
        <div class="footer-columns">
          <div class="footer-column">
            <h4>About Tech Javelin</h4>
            <ul>
              <li><a href="/about">About Us</a></li>
              <li><a href="/about#team">Management Team</a></li>
              <li><a href="/about#projects">Notable Projects</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>Resources</h4>
            <ul>
              <li><a href="/blog">Blog</a></li>
              <li><a href="https://app.hellobonsai.com/u/tech-javelin/client">Client Portal</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-legal">
          <div class="legal-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/cookies-policy">Cookies Policy</a>
            <a href="/gdpr-notice">GDPR Notice</a>
            <a href="/terms-conditions">Terms & Conditions</a>
            <a href="/sitemap">Sitemap</a>
          </div>
          <div class="footer-copyright">
            Copyright © 2022-2025 Tech Javelin Ltd - All Rights Reserved
          </div>
        </div>
      </div>
    </footer>

    <!-- Cookies Warning Banner -->
    <CookiesWarning />
  </div>
</template>

<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body {
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
  }

  #app {
    height: 100%;
  }

  .javelin-app {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    font-family: 'Segoe UI', 'Roboto', 'Arial', sans-serif;
    background: #f7f7f7;
    color: #222;
    position: relative;
  }

  /* Header sections should stay at top */
  .top-bar,
  .logo-social-row,
  .main-nav {
    flex-shrink: 0;
  }

  /* Router view container */
  .javelin-app > router-view {
    flex: 1;
    min-height: 0;
    overflow-y: visible;
    width: 100%;
    display: block;
  }

  /* Submenu styles */
  .nav-item-with-submenu {
    position: relative;
    display: inline-block;
  }
  
  .nav-item-with-submenu .nav-link {
    color: #2566af;
    text-decoration: none;
    font-weight: 500;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    transition: background 0.2s;
    font-size: 0.9rem;
    display: block;
  }
  
  .nav-item-with-submenu .nav-link:hover {
    background: #eaf2fb;
  }
  
  .submenu {
    position: absolute;
    top: 100%;
    left: 0;
    background: #fff;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    border-radius: 6px;
    min-width: 220px;
    z-index: 1000;
    padding: 0.5rem 0;
    border: 1px solid #e0e0e0;
    opacity: 0;
    visibility: hidden;
    transform: translateY(-10px);
    transition: all 0.2s ease;
  }
  
  .nav-item-with-submenu:hover .submenu {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  
  .submenu router-link {
    color: #2566af;
    padding: 0.75rem 1rem;
    display: block;
    text-decoration: none;
    font-size: 0.9rem;
    transition: all 0.2s ease;
  }
  .submenu router-link:hover {
    background: #eaf2fb;
    color: #174a7c;
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
  }
  
  .user-name {
    font-weight: 600;
    color: #333;
    font-size: 0.9rem;
    margin-bottom: 0.25rem;
  }
  
  .user-email {
    font-size: 0.8rem;
    color: #666;
  }
  
  .user-menu-item {
    display: flex;
    align-items: center;
    color: #2566af;
    padding: 0.75rem 1rem;
    text-decoration: none;
    font-size: 0.9rem;
    cursor: pointer;
    transition: background 0.2s ease;
  }
  
  .user-menu-item:hover {
    background: #eaf2fb;
    color: #174a7c;
  }
  
  .menu-icon {
    width: 16px;
    height: 16px;
    margin-right: 0.75rem;
    opacity: 0.7;
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

  /* Responsive design */
  @media (max-width: 768px) {
    .top-bar {
      flex-direction: column;
      gap: 0.5rem;
      text-align: center;
    }
    .newsletter-input {
      margin-left: 0;
      margin-top: 0.5rem;
    }
    .logo-social-row {
      flex-direction: column;
      text-align: center;
      gap: 0.5rem;
    }
    .main-nav {
      flex-wrap: wrap;
      justify-content: center;
      gap: 1rem;
    }
    .services-row {
      grid-template-columns: 1fr;
    }
    .main-content {
      margin: 1rem;
      padding: 1rem;
    }
    .footer-nav {
      grid-template-columns: 1fr;
      text-align: center;
    }
    .footer-links {
      justify-content: center;
    }
  }
  /* Top bar styles */
  .top-bar {
    background: #2566af;
    color: white;
    padding: 0.3rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }
  .newsletter-input {
    padding: 0.2rem 0.4rem;
    border: none;
    border-radius: 3px;
    margin-left: 0.5rem;
    font-size: 0.85rem;
  }
  .newsletter-btn {
    padding: 0.2rem 0.8rem;
    background: #174a7c;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .newsletter-btn:hover {
    background: #0d3558;
  }

  /* Logo and social row */
  .logo-social-row {
    background: #fff;
    color: #222;
    padding: 0.3rem 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid #e0e0e0;
  }
  .logo-img {
    height: 32px;
    width: auto;
    margin-right: 0.5rem;
  }
  .logo-title {
    font-weight: bold;
    font-size: 1.1rem;
    color: #2566af;
  }
  .social-icons {
    display: flex;
    gap: 0.75rem;
    align-items: center;
  }
  .social-icons a {
    display: inline-block;
    color: #666;
    transition: color 0.2s;
  }
  .social-icons a:hover {
    color: #2566af;
  }
  .social-icon {
    width: 20px;
    height: 20px;
  }

  /* Main navigation */
  .main-nav {
    background: #f7f7f7;
    padding: 0.5rem 1rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
  }
  .main-nav a {
    color: #2566af;
    text-decoration: none;
    font-weight: 500;
    padding: 0.3rem 0.75rem;
    border-radius: 4px;
    transition: background 0.2s;
    font-size: 0.9rem;
  }
  .main-nav a:hover {
    background: #eaf2fb;
  }
  .nav-search {
    margin-left: auto;
    color: #2566af;
    cursor: pointer;
    font-size: 1rem;
  }

  /* Footer styles */
  .site-footer {
    background: #fff;
    padding: 2rem 0;
    border-top: 1px solid #e0e0e0;
    margin-top: auto;
  }
  .footer-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
  }
  .footer-columns {
    display: flex;
    gap: 6rem;
    margin-bottom: 2rem;
  }
  .footer-column {
    flex: 0 0 auto;
  }
  .footer-column h4 {
    color: #333;
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  .footer-column ul {
    list-style: none;
    padding: 0;
    margin: 0;
    border: none;
    background: none;
    border-radius: 0;
    gap: 0;
    display: block;
  }
  .footer-column li {
    margin-bottom: 0.25rem;
    background: none;
    padding: 0;
    border: none;
  }
  .footer-column li:hover {
    background: none;
  }
  .footer-column a {
    all: unset;
    color: #2566af;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    border: 0;
    margin: 0;
  }
  .footer-column a:hover {
    color: #174a7c;
  }
  .footer-legal {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1rem;
  }
  .legal-links {
    display: flex;
    gap: 1.5rem;
  }
  .legal-links a {
    all: unset;
    color: #2566af;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    border: 0;
    margin: 0;
  }
  .legal-links a:hover {
    color: #174a7c;
  }
  .footer-copyright {
    color: #666;
    font-size: 0.9rem;
  }

  /* Dark Mode Styles */
  [data-theme="dark"] {
    background: #121212 !important;
  }

  [data-theme="dark"] body {
    background: #121212 !important;
    color: #e0e0e0;
  }

  [data-theme="dark"] .javelin-app {
    background: #121212 !important;
    color: #e0e0e0;
  }

  /* Ensure all main content areas are dark */
  [data-theme="dark"] main,
  [data-theme="dark"] .main,
  [data-theme="dark"] .content,
  [data-theme="dark"] .page-content,
  [data-theme="dark"] section {
    background: #121212 !important;
    color: #e0e0e0;
  }

  /* Logo and social row dark mode */
  [data-theme="dark"] .logo-social-row {
    background: #1a1a1a;
    color: #e0e0e0;
    border-bottom-color: #333;
  }

  [data-theme="dark"] .logo-title {
    color: #64b5f6;
  }

  [data-theme="dark"] .top-bar {
    background: #1e1e1e;
    border-bottom-color: #333;
  }

  [data-theme="dark"] .top-bar a {
    color: #e0e0e0;
  }

  [data-theme="dark"] .top-bar a:hover {
    color: #64b5f6;
  }

  [data-theme="dark"] .main-nav {
    background: #1a1a1a;
    border-bottom-color: #333;
  }

  [data-theme="dark"] .nav-links a,
  [data-theme="dark"] .main-nav a {
    color: #e0e0e0;
  }

  [data-theme="dark"] .nav-links a:hover,
  [data-theme="dark"] .main-nav a:hover {
    background: #333;
    color: #64b5f6;
  }

  [data-theme="dark"] .nav-search {
    color: #64b5f6;
  }

  [data-theme="dark"] .nav-item-with-submenu .nav-link {
    color: #e0e0e0;
  }

  [data-theme="dark"] .nav-item-with-submenu .nav-link:hover {
    background: #333;
    color: #64b5f6;
  }

  [data-theme="dark"] .submenu {
    background: #2d2d2d;
    border-color: #404040;
    box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  }

  [data-theme="dark"] .submenu router-link {
    color: #64b5f6;
  }

  [data-theme="dark"] .submenu router-link:hover {
    background: #404040;
    color: #90caf9;
  }

  [data-theme="dark"] .user-avatar {
    background: transparent;
  }

  [data-theme="dark"] .user-avatar:hover {
    background: transparent;
  }

  [data-theme="dark"] .user-icon {
    color: #b0b0b0;
  }

  [data-theme="dark"] .user-avatar:hover .user-icon {
    color: #64b5f6;
  }

  [data-theme="dark"] .user-submenu {
    background: #2d2d2d;
    border-color: #404040;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  }

  [data-theme="dark"] .user-info {
    border-bottom-color: #404040;
  }

  [data-theme="dark"] .user-name {
    color: #e0e0e0;
  }

  [data-theme="dark"] .user-email {
    color: #b0b0b0;
  }

  [data-theme="dark"] .user-menu-item {
    color: #64b5f6;
  }

  [data-theme="dark"] .user-menu-item:hover {
    background: #404040;
    color: #90caf9;
  }

  [data-theme="dark"] .user-menu-divider {
    background: #404040;
  }

  /* Main content areas */
  [data-theme="dark"] .hero {
    background: linear-gradient(135deg, #0d1421 0%, #1a237e 100%);
  }

  [data-theme="dark"] .hero h1 {
    color: #fff;
  }

  [data-theme="dark"] .hero p {
    color: #e3f2fd;
  }

  [data-theme="dark"] .hero .btn {
    background: #64b5f6;
    color: #121212;
    border: none;
  }

  [data-theme="dark"] .hero .btn:hover {
    background: #90caf9;
    color: #000;
    transform: translateY(-2px);
  }

  [data-theme="dark"] .section-title {
    color: #e0e0e0;
  }

  [data-theme="dark"] .service-card {
    background: #1a1a1a;
    border-color: #333;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  }

  [data-theme="dark"] .service-card:hover {
    background: #2d2d2d;
    box-shadow: 0 8px 30px rgba(100, 181, 246, 0.3);
    border-color: #64b5f6;
    transform: translateY(-2px);
  }

  [data-theme="dark"] .service-card h3 {
    color: #e0e0e0;
  }

  [data-theme="dark"] .service-card p {
    color: #c0c0c0;
  }

  [data-theme="dark"] .service-icon {
    color: #64b5f6;
  }

  [data-theme="dark"] .stats-grid {
    background: #1a1a1a;
    border-color: #404040;
  }

  [data-theme="dark"] .stat-item h3 {
    color: #64b5f6;
  }

  [data-theme="dark"] .stat-item p {
    color: #b0b0b0;
  }

  /* Footer improvements */
  [data-theme="dark"] .site-footer,
  [data-theme="dark"] .footer {
    background: #0f0f0f;
    border-top-color: #333;
    color: #b0b0b0;
  }

  [data-theme="dark"] .footer h4,
  [data-theme="dark"] .footer-column h4 {
    color: #e0e0e0;
  }

  [data-theme="dark"] .footer-links a,
  [data-theme="dark"] .footer-column a {
    color: #b0b0b0;
  }

  [data-theme="dark"] .footer-links a:hover,
  [data-theme="dark"] .footer-column a:hover {
    color: #64b5f6;
  }

  [data-theme="dark"] .social-icons a {
    color: #b0b0b0;
  }

  [data-theme="dark"] .social-icons a:hover {
    color: #64b5f6;
  }

  [data-theme="dark"] .footer-legal {
    border-top-color: #333;
    color: #888;
  }

  [data-theme="dark"] .legal-links a {
    color: #888;
  }

  [data-theme="dark"] .legal-links a:hover {
    color: #64b5f6;
  }

  /* Content sections */
  [data-theme="dark"] .content-section {
    background: #121212;
    color: #e0e0e0;
  }

  [data-theme="dark"] .content-wrapper {
    background: #1a1a1a;
    border-color: #333;
  }

  /* Router view and page content */
  [data-theme="dark"] .javelin-app > router-view {
    background: #121212;
    color: #e0e0e0;
  }

  /* Page containers and content areas */
  [data-theme="dark"] .page-container,
  [data-theme="dark"] .main-content,
  [data-theme="dark"] .content-area {
    background: #121212;
    color: #e0e0e0;
  }

  [data-theme="dark"] .page-header {
    background: #1a1a1a;
    border-bottom-color: #333;
    color: #e0e0e0;
  }

  [data-theme="dark"] .page-title {
    color: #e0e0e0;
  }

  [data-theme="dark"] .page-subtitle {
    color: #b0b0b0;
  }

  /* Content cards and panels */
  [data-theme="dark"] .content-card,
  [data-theme="dark"] .panel,
  [data-theme="dark"] .card {
    background: #1e1e1e;
    border-color: #404040;
    color: #e0e0e0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  [data-theme="dark"] .card-header {
    background: #252525;
    border-bottom-color: #404040;
    color: #e0e0e0;
  }

  [data-theme="dark"] .card-title {
    color: #e0e0e0;
  }

  [data-theme="dark"] .card-body,
  [data-theme="dark"] .card-content {
    background: #1e1e1e;
    color: #e0e0e0;
  }

  /* Text content styling */
  [data-theme="dark"] h1, 
  [data-theme="dark"] h2, 
  [data-theme="dark"] h3, 
  [data-theme="dark"] h4, 
  [data-theme="dark"] h5, 
  [data-theme="dark"] h6 {
    color: #e0e0e0;
  }

  [data-theme="dark"] p {
    color: #c0c0c0;
  }

  [data-theme="dark"] .text-primary {
    color: #64b5f6 !important;
  }

  [data-theme="dark"] .text-secondary {
    color: #b0b0b0 !important;
  }

  [data-theme="dark"] .text-muted {
    color: #888 !important;
  }

  /* Links in content */
  [data-theme="dark"] .content-area a,
  [data-theme="dark"] .main-content a,
  [data-theme="dark"] .page-container a {
    color: #64b5f6;
    text-decoration: none;
  }

  [data-theme="dark"] .content-area a:hover,
  [data-theme="dark"] .main-content a:hover,
  [data-theme="dark"] .page-container a:hover {
    color: #90caf9;
    text-decoration: underline;
  }

  /* Lists in content */
  [data-theme="dark"] .content-area ul,
  [data-theme="dark"] .content-area ol {
    color: #c0c0c0;
  }

  [data-theme="dark"] .content-area li {
    color: #c0c0c0;
  }

  [data-theme="dark"] .content-area li::marker {
    color: #64b5f6;
  }

  /* Code blocks and inline code */
  [data-theme="dark"] code {
    background: #2d2d2d;
    color: #e0e0e0;
    border: 1px solid #404040;
    padding: 0.2em 0.4em;
    border-radius: 3px;
  }

  [data-theme="dark"] pre {
    background: #1e1e1e;
    color: #e0e0e0;
    border: 1px solid #404040;
    border-radius: 6px;
    padding: 1rem;
  }

  [data-theme="dark"] pre code {
    background: transparent;
    border: none;
    padding: 0;
  }

  /* Blockquotes */
  [data-theme="dark"] blockquote {
    background: #1e1e1e;
    border-left: 4px solid #64b5f6;
    color: #c0c0c0;
    padding: 1rem;
    margin: 1rem 0;
  }

  /* Dividers and separators */
  [data-theme="dark"] hr {
    border-color: #404040;
    background: #404040;
  }

  [data-theme="dark"] .divider {
    background: #404040;
  }

  /* Content sections with specific backgrounds */
  [data-theme="dark"] .sidebar {
    background: #1a1a1a;
    border-color: #333;
    color: #e0e0e0;
  }

  [data-theme="dark"] .well,
  [data-theme="dark"] .info-box {
    background: #1e1e1e;
    border-color: #404040;
    color: #c0c0c0;
  }

  [data-theme="dark"] .alert {
    border-color: #404040;
    color: #e0e0e0;
  }

  [data-theme="dark"] .alert-info {
    background: #1a2332;
    border-color: #64b5f6;
    color: #e3f2fd;
  }

  [data-theme="dark"] .alert-success {
    background: #1b2e1b;
    border-color: #4caf50;
    color: #e8f5e8;
  }

  [data-theme="dark"] .alert-warning {
    background: #2e2416;
    border-color: #ff9800;
    color: #fff3cd;
  }

  [data-theme="dark"] .alert-error,
  [data-theme="dark"] .alert-danger {
    background: #2e1618;
    border-color: #f44336;
    color: #f8d7da;
  }

  /* Forms and inputs */
  [data-theme="dark"] input,
  [data-theme="dark"] textarea,
  [data-theme="dark"] select {
    background: #2d2d2d;
    border-color: #404040;
    color: #e0e0e0;
  }

  [data-theme="dark"] input:focus,
  [data-theme="dark"] textarea:focus,
  [data-theme="dark"] select:focus {
    border-color: #64b5f6;
    box-shadow: 0 0 0 2px rgba(100, 181, 246, 0.2);
  }

  /* Buttons */
  [data-theme="dark"] .btn-primary {
    background: #64b5f6;
    color: #121212;
    border-color: #64b5f6;
  }

  [data-theme="dark"] .btn-primary:hover {
    background: #90caf9;
    border-color: #90caf9;
    color: #000;
  }

  [data-theme="dark"] .btn-secondary {
    background: transparent;
    color: #64b5f6;
    border-color: #64b5f6;
  }

  [data-theme="dark"] .btn-secondary:hover {
    background: #64b5f6;
    color: #121212;
  }

  /* Tables */
  [data-theme="dark"] table {
    background: #1a1a1a;
    border-color: #404040;
  }

  [data-theme="dark"] th {
    background: #2d2d2d;
    color: #e0e0e0;
    border-color: #404040;
  }

  [data-theme="dark"] td {
    border-color: #404040;
    color: #b0b0b0;
  }

  [data-theme="dark"] tr:hover {
    background: #252525;
  }

  /* Modals and overlays */
  [data-theme="dark"] .modal-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  [data-theme="dark"] .modal-content {
    background: #1e1e1e;
    color: #e0e0e0;
    border-color: #404040;
  }

  /* Scrollbars */
  [data-theme="dark"] ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  [data-theme="dark"] ::-webkit-scrollbar-track {
    background: #1a1a1a;
  }

  [data-theme="dark"] ::-webkit-scrollbar-thumb {
    background: #404040;
    border-radius: 4px;
  }

  [data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
    background: #555;
  }

  /* Responsive footer */
  @media (max-width: 768px) {
    .footer-columns {
      flex-direction: column;
      gap: 2rem;
    }
    .footer-legal {
      flex-direction: column;
      align-items: flex-start;
      gap: 1rem;
    }
    .legal-links {
      flex-wrap: wrap;
    }
  }

  /* Comprehensive white background overrides for dark mode */
  [data-theme="dark"] * {
    scrollbar-width: thin;
    scrollbar-color: #404040 #1a1a1a;
  }

  [data-theme="dark"] div,
  [data-theme="dark"] section,
  [data-theme="dark"] article,
  [data-theme="dark"] main,
  [data-theme="dark"] .container,
  [data-theme="dark"] .wrapper {
    background-color: #121212 !important;
  }

  /* Catch any remaining white backgrounds */
  [data-theme="dark"] [style*="background: #fff"],
  [data-theme="dark"] [style*="background: white"],
  [data-theme="dark"] [style*="background-color: #fff"],
  [data-theme="dark"] [style*="background-color: white"] {
    background: #121212 !important;
    background-color: #121212 !important;
  }

  /* Amplify UI customizations */
  [data-amplify-theme] {
    --amplify-components-authenticator-router-background-color: #f7f7f7;
    --amplify-components-authenticator-router-border-color: #e0e0e0;
    --amplify-colors-brand-primary-80: #2566af;
    --amplify-colors-brand-primary-90: #1e5299;
    --amplify-colors-brand-primary-100: #1a4684;
  }

  [data-theme="dark"] [data-amplify-theme] {
    --amplify-components-authenticator-router-background-color: #1a1a1a;
    --amplify-components-authenticator-router-border-color: #333;
    --amplify-colors-neutral-10: #1a1a1a;
    --amplify-colors-neutral-20: #2d2d2d;
    --amplify-colors-neutral-100: #e0e0e0;
  }

</style>