import { createRouter, createWebHistory } from 'vue-router'
import { getCurrentUser } from 'aws-amplify/auth'
import App from './App.vue'
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import Services from './pages/Services.vue'
import About from './pages/About.vue'
import Blog from './pages/Blog.vue'
import BlogPost from './pages/BlogPost.vue'
import AdminDashboard from './pages/AdminDashboard.vue'
import PrivacyPolicy from './pages/PrivacyPolicy.vue'
import CookiesPolicy from './pages/CookiesPolicy.vue'
import GDPRNotice from './pages/GDPRNotice.vue'
import TermsConditions from './pages/TermsConditions.vue'
import Profile from './pages/Profile.vue'
import Preferences from './pages/Preferences.vue'

const routes = [
  { 
    path: '/', 
    component: Home,
    name: 'home'
  },
  { 
    path: '/login', 
    component: Login,
    name: 'login'
  },
  { 
    path: '/services', 
    component: Services,
    name: 'services'
  },
  { 
    path: '/about', 
    component: About,
    name: 'about'
  },
  { 
    path: '/blog', 
    component: Blog,
    name: 'blog'
  },
  { 
    path: '/blog/:slug', 
    component: BlogPost,
    name: 'blog-post'
  },
  { 
    path: '/admin', 
    component: AdminDashboard,
    name: 'admin-dashboard',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/posts', 
    component: AdminDashboard, // Placeholder - will create dedicated components later
    name: 'admin-posts',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/users', 
    component: AdminDashboard, // This will show the user management section
    name: 'admin-users',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/authors', 
    component: AdminDashboard,
    name: 'admin-authors',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/categories', 
    component: AdminDashboard,
    name: 'admin-categories',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/tags', 
    component: AdminDashboard,
    name: 'admin-tags',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/subscribers', 
    component: AdminDashboard,
    name: 'admin-subscribers',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/analytics', 
    component: AdminDashboard,
    name: 'admin-analytics',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/reports', 
    component: AdminDashboard,
    name: 'admin-reports',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/settings', 
    component: AdminDashboard,
    name: 'admin-settings',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/admin/backups', 
    component: AdminDashboard,
    name: 'admin-backups',
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  { 
    path: '/privacy-policy', 
    component: PrivacyPolicy,
    name: 'privacy-policy'
  },
  { 
    path: '/cookies-policy', 
    component: CookiesPolicy,
    name: 'cookies-policy'
  },
  { 
    path: '/gdpr-notice', 
    component: GDPRNotice,
    name: 'gdpr-notice'
  },
  { 
    path: '/terms-conditions', 
    component: TermsConditions,
    name: 'terms-conditions'
  },
  { 
    path: '/profile', 
    component: Profile,
    name: 'profile',
    meta: { requiresAuth: true }
  },
  { 
    path: '/preferences', 
    component: Preferences,
    name: 'preferences',
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Global route guard for authentication
router.beforeEach(async (to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)
  
  if (requiresAuth || requiresAdmin) {
    try {
      const user = await getCurrentUser()
      
      if (requiresAdmin) {
        // Check if user is admin (simple check by email for now)
        const isAdmin = (user as any)?.signInDetails?.loginId === 'admin@techjavelin.com'
        
        if (!isAdmin) {
          console.warn('Admin access required')
          next('/login')
          return
        }
      }
      
      next()
    } catch (error) {
      console.log('User not authenticated, redirecting to login')
      next('/login')
    }
  } else {
    next()
  }
})

export default router
