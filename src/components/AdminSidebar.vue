<template>
  <aside class="admin-sidebar" :class="{ 'collapsed': isCollapsed }">
    <!-- Toggle Button -->
    <button 
      @click="toggleSidebar" 
      class="sidebar-toggle"
      :title="isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
    >
      <font-awesome-icon :icon="isCollapsed ? 'chevron-right' : 'chevron-left'" />
    </button>

    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="sidebar-logo" v-if="!isCollapsed">
  <h2><font-awesome-icon :icon="faTachometerAlt" class="sidebar-logo-svg" /> Javelin Pulse Admin</h2>
      </div>
      <div class="sidebar-logo-compact" v-else>
  <span><font-awesome-icon :icon="faTachometerAlt" class="sidebar-logo-svg" /> JP</span>
      </div>
    </div>

    <!-- Navigation Menu -->
    <nav class="sidebar-nav">
      <ul class="nav-menu">
        <!-- Dashboard -->
        <li class="nav-item">
          <router-link 
            to="/admin" 
            class="nav-link"
            :class="{ active: $route.path === '/admin' }"
          >
            <span class="nav-icon"><font-awesome-icon :icon="faTachometerAlt" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Dashboard</span>
          </router-link>
        </li>

        <!-- Content Management -->
        <li class="nav-group" v-if="!isCollapsed">
          <span class="group-title">Content</span>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/posts" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faNewspaper" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Posts</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/categories" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faFolderOpen" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Categories</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/tags" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faTags" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Tags</span>
          </router-link>
        </li>

        <!-- User Management -->
        <li class="nav-group" v-if="!isCollapsed">
          <span class="group-title">Users</span>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/users" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faUsersCog" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">User Management</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/authors" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faUserEdit" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Authors</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/subscribers" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faUserCheck" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Subscribers</span>
          </router-link>
        </li>

        <!-- Analytics & Reports -->
        <li class="nav-group" v-if="!isCollapsed">
          <span class="group-title">Analytics</span>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/analytics" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faChartBar" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Analytics</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/reports" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faFileAlt" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Reports</span>
          </router-link>
        </li>

        <!-- Pulse Platform Admin Section -->
        <li class="nav-group" v-if="!isCollapsed">
          <span class="group-title">Pulse Platform</span>
        </li>
        <li class="nav-item">
          <router-link to="/admin/pulse-platform" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faTachometerAlt" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Pulse Platform Admin</span>
          </router-link>
        </li>
        <li class="nav-item">
          <router-link to="/admin/pulse-submissions" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faEnvelopeOpenText" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Pulse Invite Submissions</span>
          </router-link>
        </li>
        <!-- System -->
        <li class="nav-group" v-if="!isCollapsed">
          <span class="group-title">System</span>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/settings" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faCog" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Settings</span>
          </router-link>
        </li>
        
        <li class="nav-item">
          <router-link to="/admin/backups" class="nav-link">
            <span class="nav-icon"><font-awesome-icon :icon="faDatabase" class="sidebar-png-icon" /></span>
            <span class="nav-text" v-if="!isCollapsed">Backups</span>
          </router-link>
        </li>
      </ul>
    </nav>

    <!-- Quick Actions (Compact) -->
    <div class="sidebar-actions" v-if="!isCollapsed">
      <router-link to="/admin/posts/new" class="quick-action-btn primary">
  <span class="action-icon"><font-awesome-icon :icon="faPlusSquare" class="sidebar-png-icon" /></span>
        <span class="action-text">New Post</span>
      </router-link>
    </div>

    <!-- User Info -->
    <div class="sidebar-footer">
      <div class="user-info clickable" v-if="!isCollapsed" @click="userMenuVisible = !userMenuVisible">
        <div class="user-avatar">
          <span>{{ userInitials }}</span>
        </div>
        <div class="user-details">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">Administrator</div>
        </div>
        <UserContextMenu :visible="userMenuVisible" />
      </div>
      <div class="user-info-compact" v-else>
        <div class="user-avatar">
          <span>{{ userInitials }}</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCurrentUser } from 'aws-amplify/auth'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import UserContextMenu from './UserContextMenu.vue'
const userMenuVisible = ref(false)
import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faTachometerAlt,
  faNewspaper,
  faFolderOpen,
  faTags,
  faUsersCog,
  faUserEdit,
  faUserCheck,
  faChartBar,
  faFileAlt,
  faCog,
  faDatabase,
  faPlusSquare,
  faChevronLeft,
  faChevronRight,
  faEnvelopeOpenText
} from '@fortawesome/free-solid-svg-icons'

library.add(
  faTachometerAlt,
  faNewspaper,
  faFolderOpen,
  faTags,
  faUsersCog,
  faUserEdit,
  faUserCheck,
  faChartBar,
  faFileAlt,
  faCog,
  faDatabase,
  faPlusSquare,
  faChevronLeft,
  faChevronRight,
  faEnvelopeOpenText
)

// Register FontAwesomeIcon locally
defineExpose({ FontAwesomeIcon })

// Props
const props = defineProps({
  initialCollapsed: {
    type: Boolean,
    default: false
  }
})

// Emits
const emit = defineEmits(['toggle'])

// State
const isCollapsed = ref(props.initialCollapsed)
const currentUser = ref(null)

// Computed
const userName = computed(() => {
  if (!currentUser.value) return 'Admin User'
  return currentUser.value.signInDetails?.loginId?.split('@')[0] || 'Admin'
})

const userInitials = computed(() => {
  const name = userName.value
  return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2)
})

// Methods
const toggleSidebar = () => {
  isCollapsed.value = !isCollapsed.value
  emit('toggle', isCollapsed.value)
  
  // Store preference in localStorage
  localStorage.setItem('adminSidebarCollapsed', isCollapsed.value.toString())
}

// Initialize
onMounted(async () => {
  try {
    currentUser.value = await getCurrentUser()
    
    // Restore sidebar state from localStorage
    const savedState = localStorage.getItem('adminSidebarCollapsed')
    if (savedState !== null) {
      isCollapsed.value = savedState === 'true'
    }
  } catch (error) {
    console.error('Error loading user:', error)
  }
})
</script>

<style scoped>
.admin-sidebar {
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: linear-gradient(180deg, #1a1f36 0%, #2d3748 100%);
  color: white;
  transition: width 0.3s ease;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
}

.admin-sidebar.collapsed {
  width: 80px;
}

/* Toggle Button */

.sidebar-toggle {
  position: absolute;
  top: 1rem;
  right: -15px;
  width: 32px;
  height: 32px;
  background: transparent;
  color: #e2e8f0;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 1001;
}


.sidebar-toggle:hover {
  border-color: #60a5fa;
  color: #60a5fa;
  transform: scale(1.1);
}

.sidebar-toggle svg {
  width: 16px;
  height: 16px;
}

/* Header */
.sidebar-header {
  padding: 1.5rem 1rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
}

.sidebar-logo h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #e2e8f0;
}

.sidebar-logo-compact {
  text-align: center;
  font-size: 1.5rem;
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 0.5rem;
}

.nav-menu {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-group {
  margin-top: 2rem;
}

.group-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  font-weight: 600;
  color: #94a3b8;
  padding: 0 1rem 0.5rem;
  letter-spacing: 0.05em;
}

.nav-item {
  margin-bottom: 0.25rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: #cbd5e1;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  position: relative;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateX(4px);
}

.nav-link.active {
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  color: white;
  font-weight: 500;
}

.nav-link.active::before {
  content: '';
  position: absolute;
  left: -0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 20px;
  background: #60a5fa;
  border-radius: 2px;
}

.nav-icon {
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.3s ease;
}

.collapsed .nav-text {
  opacity: 0;
}

/* Quick Actions */
.sidebar-actions {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #16a34a, #22c55e);
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.quick-action-btn:hover {
  background: linear-gradient(135deg, #15803d, #16a34a);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
}

.action-icon {
  font-size: 1.1rem;
}

/* Footer */
.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-info-compact {
  display: flex;
  justify-content: center;
}

.user-avatar {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #2563eb, #3b82f6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: white;
  flex-shrink: 0;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 0.9rem;
  font-weight: 500;
  color: #e2e8f0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.8rem;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Responsive */
@media (max-width: 768px) {
  .admin-sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease, width 0.3s ease;
  }

  .admin-sidebar.collapsed {
    transform: translateX(0);
    width: 80px;
  }

  .sidebar-toggle {
    display: block;
  }
}

/* Dark mode compatibility */
[data-theme="dark"] .admin-sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
}

[data-theme="dark"] .nav-link.active {
  background: linear-gradient(135deg, #1e40af, #2563eb);
}

/* Scrollbar styling */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>
