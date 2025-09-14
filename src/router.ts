import AdminPulsePlatform from './pages/AdminPulsePlatform.vue'
import { createRouter, createWebHistory } from 'vue-router'
import SigInt from './pages/SigInt.vue'
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
import JavelinPulse from './pages/JavelinPulse.vue'
import AdminPulseSubmissions from './pages/AdminPulseSubmissions.vue'

const routes = [
  {
    path: '/security-demo1',
    component: () => import('./pages/SecurityDemo1.vue'),
    name: 'security-demo1',
    meta: { hideTopNav: false }
  },
  {
    path: '/security-demo2',
    component: () => import('./pages/SecurityDemo2.vue'),
    name: 'security-demo2',
    meta: { hideTopNav: false }
  },
  {
    path: '/security-demo3',
    component: () => import('./pages/SecurityDemo3.vue'),
    name: 'security-demo3',
    meta: { hideTopNav: false }
  },
  {
    path: '/security-demo4',
    component: () => import('./pages/SecurityDemo4.vue'),
    name: 'security-demo4',
    meta: { hideTopNav: false }
  },
  {
    path: '/demo1',
    component: () => import('./pages/Demo1.vue'),
    name: 'demo1',
    meta: { hideTopNav: false }
  },
  {
    path: '/demo2',
    component: () => import('./pages/Demo2.vue'),
    name: 'demo2',
    meta: { hideTopNav: false }
  },
  {
    path: '/demo3',
    component: () => import('./pages/Demo3.vue'),
    name: 'demo3',
    meta: { hideTopNav: false }
  },
  {
    path: '/demo4',
    component: () => import('./pages/Demo4.vue'),
    name: 'demo4',
    meta: { hideTopNav: false }
  },
  {
    path: '/admin/pulse-platform',
    component: AdminPulsePlatform,
    name: 'admin-pulse-platform',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
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
    name: 'blog-post',
    props: true
  },
  {
    path: '/sigint',
    component: SigInt,
    name: 'sigint',
    meta: { requiresAuth: true, hideTopNav: true }
  },
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
    path: '/pulse',
    component: () => import('./pages/PulsePlatform.vue'),
    name: 'pulse-platform'
  },
  { 
    path: '/services', 
    component: Services,
    name: 'services'
  },
  { 
    path: '/admin', 
    component: AdminDashboard,
    name: 'admin-dashboard',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/posts',
    component: () => import('./pages/AdminPosts.vue'),
    name: 'admin-posts',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/posts/new',
    component: () => import('./pages/AdminPostNew.vue'),
    name: 'admin-posts-new',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/posts/:id/edit',
    component: () => import('./pages/AdminPostEdit.vue'),
    name: 'admin-posts-edit',
    props: true,
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/categories',
    component: () => import('./pages/AdminCategories.vue'),
    name: 'admin-categories',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/tags',
    component: () => import('./pages/AdminTags.vue'),
    name: 'admin-tags',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/users',
    component: () => import('./pages/AdminUserManagement.vue'),
    name: 'admin-user-management',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/authors',
    component: () => import('./pages/AdminAuthors.vue'),
    name: 'admin-authors',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/subscribers',
    component: () => import('./pages/AdminSubscribers.vue'),
    name: 'admin-subscribers',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/analytics',
    component: () => import('./pages/AdminAnalytics.vue'),
    name: 'admin-analytics',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/reports',
    component: () => import('./pages/AdminReports.vue'),
    name: 'admin-reports',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/settings',
    component: () => import('./pages/AdminSettings.vue'),
    name: 'admin-settings',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/backups',
    component: () => import('./pages/AdminBackups.vue'),
    name: 'admin-backups',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
  },
  {
    path: '/admin/pulse-submissions',
    component: AdminPulseSubmissions,
    name: 'admin-pulse-submissions',
    meta: { requiresAuth: true, requiresAdmin: true, hideTopNav: true }
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
  },
  {
    path: '/javelin-pulse',
    component: JavelinPulse,
    name: 'javelin-pulse'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

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
