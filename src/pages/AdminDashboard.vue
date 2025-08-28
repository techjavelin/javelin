<template>
  <div class="admin-dashboard-layout">
    <!-- Sidebar Navigation -->
    <AdminSidebar @toggle="handleSidebarToggle" />
    
    <!-- Main Content Area -->
    <div class="admin-dashboard" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <!-- Header -->
      <header class="dashboard-header">
        <div class="header-content">
          <h1>📊 Dashboard Overview</h1>
          <div class="user-info">
            <span class="welcome">Welcome back, {{ currentUser?.signInDetails?.loginId || 'Admin' }}</span>
            <button @click="handleSignOut" class="sign-out-btn">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="dashboard-main">
        <!-- Quick Stats -->
        <section class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <h3>{{ stats.totalPosts }}</h3>
              <p>Total Posts</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
              <h3>{{ stats.totalAuthors }}</h3>
              <p>Authors</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📧</div>
            <div class="stat-content">
              <h3>{{ stats.totalSubscribers }}</h3>
              <p>Subscribers</p>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">👁️</div>
            <div class="stat-content">
              <h3>{{ stats.totalViews }}</h3>
              <p>Total Views</p>
            </div>
          </div>
        </section>

        <!-- Dashboard Sections -->
        <div class="dashboard-grid">
          <!-- Recent Posts -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>📝 Recent Posts</h2>
              <router-link to="/admin/posts" class="section-link">View All</router-link>
            </div>
            
            <div class="posts-list" v-if="!loadingPosts && recentPosts.length > 0">
              <div v-for="post in recentPosts" :key="post.id" class="post-item">
                <div class="post-info">
                  <h4 class="post-title">{{ post.title }}</h4>
                  <p class="post-meta">
                    <span class="post-status" :class="`status-${post.status.toLowerCase()}`">
                      {{ post.status }}
                    </span>
                    <span class="post-date">{{ formatDate(post.publishedAt || post.createdAt) }}</span>
                    <span class="post-views">{{ post.viewCount || 0 }} views</span>
                  </p>
                </div>
                <div class="post-actions">
                  <router-link :to="`/blog/${post.slug}`" class="action-btn view">View</router-link>
                  <router-link :to="`/admin/posts/${post.id}/edit`" class="action-btn edit">Edit</router-link>
                </div>
              </div>
            </div>
            
            <div v-else-if="loadingPosts" class="loading-state">
              <div class="loading-spinner"></div>
              <p>Loading posts...</p>
            </div>
            
            <div v-else class="empty-state">
              <p>No posts found</p>
              <router-link to="/admin/posts/new" class="create-post-btn">Create First Post</router-link>
            </div>
          </section>

          <!-- Analytics Overview -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>📊 Analytics Overview</h2>
              <router-link to="/admin/analytics" class="section-link">View Details</router-link>
            </div>
            
            <div class="analytics-content">
              <div class="chart-placeholder">
                <div class="chart-icon">📈</div>
                <p>Analytics charts will be implemented here</p>
                <small>Track views, engagement, and growth over time</small>
              </div>
              
              <div class="analytics-metrics">
                <div class="metric">
                  <span class="metric-label">This Month</span>
                  <span class="metric-value">{{ stats.monthlyViews }}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Avg. Read Time</span>
                  <span class="metric-value">{{ stats.avgReadTime }}m</span>
                </div>
                <div class="metric">
                  <span class="metric-label">Bounce Rate</span>
                  <span class="metric-value">{{ stats.bounceRate }}%</span>
                </div>
              </div>
            </div>
          </section>

          <!-- Recent Activity -->
          <section class="dashboard-section">
            <div class="section-header">
              <h2>🕒 Recent Activity</h2>
            </div>
            
            <div class="activity-feed">
              <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                <div class="activity-icon" :class="activity.type">
                  {{ getActivityIcon(activity.type) }}
                </div>
                <div class="activity-content">
                  <p class="activity-message">{{ activity.message }}</p>
                  <span class="activity-time">{{ formatRelativeTime(activity.timestamp) }}</span>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- User Management -->
        <section class="dashboard-section full-width user-management-section">
          <UserManagement />
        </section>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { signOut, getCurrentUser } from 'aws-amplify/auth'
import { useBlogPosts } from '../composables/useBlog'
import UserManagement from '../components/UserManagement.vue'
import AdminSidebar from '../components/AdminSidebar.vue'
import amplifyOutputs from '../../amplify_outputs.json'

const router = useRouter()

// Composables
const {
  posts: recentPosts,
  loading: loadingPosts,
  fetchPosts
} = useBlogPosts()

// Reactive data
const currentUser = ref(null)
const amplifyConfig = ref(null)
const sidebarCollapsed = ref(false)
const stats = ref({
  totalPosts: 0,
  totalAuthors: 0,
  totalSubscribers: 0,
  totalViews: 0,
  monthlyViews: 0,
  avgReadTime: 0,
  bounceRate: 0
})

const recentActivity = ref([
  {
    id: 1,
    type: 'post',
    message: 'New blog post "Cybersecurity 2025" was published',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
  },
  {
    id: 2,
    type: 'subscriber',
    message: '5 new newsletter subscribers joined',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 hours ago
  },
  {
    id: 3,
    type: 'comment',
    message: 'New comment on "Cloud Migration Guide"',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
  {
    id: 4,
    type: 'user',
    message: 'Admin user logged in',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 hours ago
  }
])

// Methods
const handleSignOut = async () => {
  try {
    await signOut()
    router.push('/login')
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}

const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

const formatRelativeTime = (date) => {
  const now = new Date()
  const diff = now - new Date(date)
  const hours = Math.floor(diff / (1000 * 60 * 60))
  
  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60))
    return `${minutes}m ago`
  } else if (hours < 24) {
    return `${hours}h ago`
  } else {
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }
}

const getActivityIcon = (type) => {
  switch (type) {
    case 'post': return '📝'
    case 'subscriber': return '📧'
    case 'comment': return '💬'
    case 'user': return '👤'
    default: return '📋'
  }
}

const loadDashboardData = async () => {
  try {
    // Load recent posts
    await fetchPosts({ 
      status: 'PUBLISHED', 
      limit: 5 
    })
    
    // Calculate stats based on loaded data
    stats.value.totalPosts = recentPosts.value?.length || 0
    stats.value.totalViews = recentPosts.value?.reduce((total, post) => total + (post.viewCount || 0), 0) || 0
    
    // Mock data for other stats (in a real app, these would come from your API)
    stats.value.totalAuthors = 3
    stats.value.totalSubscribers = 142
    stats.value.monthlyViews = 1254
    stats.value.avgReadTime = 5.2
    stats.value.bounceRate = 35
    
  } catch (error) {
    console.error('Error loading dashboard data:', error)
  }
}

const handleSidebarToggle = (collapsed) => {
  sidebarCollapsed.value = collapsed
}

// Initialize
onMounted(async () => {
  try {
    // Load Amplify configuration
    amplifyConfig.value = amplifyOutputs
    
    currentUser.value = await getCurrentUser()
    await loadDashboardData()
  } catch (error) {
    console.error('Error loading user or dashboard data:', error)
    // Redirect to login if not authenticated
    router.push('/login')
  }
})
</script>

<style scoped>
/* Layout Container */
.admin-dashboard-layout {
  display: flex;
  min-height: 100vh;
  width: 100vw;
  overflow-x: hidden;
}

/* Main Dashboard Content */
.admin-dashboard {
  flex: 1;
  margin-left: 280px;
  min-height: 100vh;
  background: #f8f9fa;
  transition: margin-left 0.3s ease;
  width: calc(100vw - 280px);
}

.admin-dashboard.sidebar-collapsed {
  margin-left: 80px;
  width: calc(100vw - 80px);
}

/* Header */
.dashboard-header {
  background: white;
  border-bottom: 1px solid #e9ecef;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.dashboard-header h1 {
  margin: 0;
  color: #333;
  font-size: 1.5rem;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.welcome {
  color: #666;
  font-size: 0.9rem;
}

.sign-out-btn {
  background: #dc3545;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s ease;
}

.sign-out-btn:hover {
  background: #c82333;
}

/* Main Content */
.dashboard-main {
  padding: 2rem;
  width: 100%;
  max-width: none;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
  width: 100%;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.stat-icon {
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #2566af, #3b82f6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  color: #333;
}

.stat-content p {
  margin: 0.25rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

/* Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
  width: 100%;
}

.dashboard-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
}

.dashboard-section.full-width {
  grid-column: 1 / -1;
  padding: 0;
}

.user-management-section {
  margin-top: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e9ecef;
}

.section-header h2 {
  margin: 0;
  color: #333;
  font-size: 1.2rem;
}

.section-link {
  color: #2566af;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.section-link:hover {
  text-decoration: underline;
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.post-info {
  flex: 1;
}

.post-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.post-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.post-status {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-published {
  background: #d4edda;
  color: #155724;
}

.status-draft {
  background: #fff3cd;
  color: #856404;
}

.status-archived {
  background: #f8d7da;
  color: #721c24;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn.view {
  background: #e9ecef;
  color: #495057;
}

.action-btn.view:hover {
  background: #dee2e6;
}

.action-btn.edit {
  background: #2566af;
  color: white;
}

.action-btn.edit:hover {
  background: #1a4d87;
}

/* Loading and Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2566af;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.create-post-btn {
  display: inline-block;
  background: #2566af;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1rem;
  font-weight: 500;
}

.create-post-btn:hover {
  background: #1a4d87;
}

/* Analytics */
.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-placeholder {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  color: #666;
}

.chart-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.analytics-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

/* Posts List */
.posts-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.post-info {
  flex: 1;
}

.post-title {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #333;
  font-weight: 600;
}

.post-meta {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
  display: flex;
  gap: 1rem;
  align-items: center;
}

.post-status {
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.status-published {
  background: #d4edda;
  color: #155724;
}

.status-draft {
  background: #fff3cd;
  color: #856404;
}

.status-archived {
  background: #f8d7da;
  color: #721c24;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
}

.action-btn {
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.action-btn.view {
  background: #e9ecef;
  color: #495057;
}

.action-btn.view:hover {
  background: #dee2e6;
}

.action-btn.edit {
  background: #2566af;
  color: white;
}

.action-btn.edit:hover {
  background: #1a4d87;
}

/* Loading and Empty States */
.loading-state, .empty-state {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2566af;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.create-post-btn {
  display: inline-block;
  background: #2566af;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  text-decoration: none;
  margin-top: 1rem;
  font-weight: 500;
}

.create-post-btn:hover {
  background: #1a4d87;
}

/* Analytics */
.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-placeholder {
  background: #f8f9fa;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  padding: 3rem 2rem;
  text-align: center;
  color: #666;
}

.chart-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.analytics-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.metric {
  text-align: center;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.metric-label {
  display: block;
  font-size: 0.8rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.metric-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
}

/* Activity Feed */
.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.activity-item {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
}

.activity-icon.post {
  background: #e3f2fd;
}

.activity-icon.subscriber {
  background: #f3e5f5;
}

.activity-icon.comment {
  background: #e8f5e8;
}

.activity-icon.user {
  background: #fff3e0;
}

.activity-content {
  flex: 1;
}

.activity-message {
  margin: 0 0 0.25rem;
  color: #333;
  font-size: 0.9rem;
}

.activity-time {
  font-size: 0.8rem;
  color: #666;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .admin-dashboard {
    margin-left: 80px;
    width: calc(100vw - 80px);
  }
}

@media (max-width: 768px) {
  .admin-dashboard {
    margin-left: 0;
    width: 100vw;
  }
  
  .dashboard-main {
    padding: 1rem;
  }
  
  .dashboard-header {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .post-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
  
  .analytics-metrics {
    grid-template-columns: 1fr;
  }
}

/* Dark Mode Support */
[data-theme="dark"] .admin-dashboard {
  background: #121212;
}

[data-theme="dark"] .dashboard-header {
  background: #1e1e1e;
  border-bottom-color: #333;
}

[data-theme="dark"] .dashboard-header h1 {
  color: #e0e0e0;
}

[data-theme="dark"] .stat-card,
[data-theme="dark"] .dashboard-section {
  background: #1e1e1e;
  border-color: #333;
}

[data-theme="dark"] .stat-content h3,
[data-theme="dark"] .section-header h2 {
  color: #e0e0e0;
}

[data-theme="dark"] .activity-message {
  color: #e0e0e0;
}
</style>
