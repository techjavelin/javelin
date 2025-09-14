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
  <div class="javelin-app" @click="handleClickOutside" style="background: var(--color-bg-light); color: var(--color-text-light);">
    <!-- Top blue bar: only show on main site -->
    <div v-if="!route.meta.hideTopNav" class="top-bar bg-card" style="color: var(--color-text-light);">
      <span>Sign-up for updates now!</span>
      <input type="email" placeholder="Your email address..." class="newsletter-input" />
      <button class="newsletter-btn btn">Subscribe</button>
    </div>
    <!-- Logo row -->
    <div class="logo-row bg-card" style="color: var(--color-text-light);">
      <img src="https://techjavelin.com/wp-content/uploads/2022/10/cropped-Tech-Javelin-Ltd-logos_transparent.png" alt="Tech Javelin Logo" class="logo-img" />
      <span class="logo-title">Tech Javelin</span>
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
/* ...existing component-specific styles... */

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
    color: #fff;
    padding: 0.35rem 1rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 0.85rem;
    line-height: 1;
    flex-wrap: nowrap;
  }
  .top-bar form.newsletter-form {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
  }
  .newsletter-input {
    padding: 0.45rem 0.6rem;
    border: 1px solid rgba(255,255,255,0.85);
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border-radius: 6px;
    font-size: 0.85rem;
    line-height: 1;
    height: 2rem;
    color: #fff;
    width: 200px;
    margin: 0; /* Override global input margin */
  }
  .newsletter-input::placeholder {
    color: rgba(0,0,0,0.45);
  }
  .newsletter-input:focus {
    outline: none;
    border-color: #174a7c;
    background: #fff;
    color: #174a7c;
  }
  .newsletter-btn {
    padding: 0.45rem 1rem;
    height: 2rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #90caf9;
    color: #0a2540;
    border: 1px solid #90caf9;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    line-height: 1;
    transition: background 0.2s, color 0.2s, transform 0.15s;
    margin: 0; /* Prevent vertical misalignment */
  }
  .newsletter-btn:hover {
    background: #64b5f6;
  }
  .newsletter-btn:active {
    transform: translateY(1px);
  }
  .newsletter-btn:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
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
    background: #161e27;
    border-bottom-color: #222;
  }

  [data-theme="dark"] .top-bar a {
    color: #e0e0e0;
  }

  [data-theme="dark"] .top-bar a:hover {
    color: #64b5f6;
  }
  /* Dark mode newsletter form */
  [data-theme="dark"] .newsletter-input {
    border-color: rgba(255,255,255,0.25);
    background: rgba(255,255,255,0.08);
    color: #e0e0e0;
  }
  [data-theme="dark"] .newsletter-input:focus {
    border-color: #64b5f6;
    background: rgba(100,181,246,0.15);
  }
  [data-theme="dark"] .newsletter-input::placeholder {
    color: rgba(255,255,255,0.55);
  }
  [data-theme="dark"] .newsletter-btn {
    background: #2566af;
    border-color: #2566af;
    color: #fff;
  }
  [data-theme="dark"] .newsletter-btn:hover {
    background: #1e4f86;
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

  [data-theme="dark"] .card-body {
  /* [data-theme="dark"] .card-content { */
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

  /* Narrowed: avoid forcing all divs to dark background (was causing black boxes) */
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