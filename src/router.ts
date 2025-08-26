import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Home from './pages/Home.vue'
import Login from './pages/Login.vue'
import Services from './pages/Services.vue'
import About from './pages/About.vue'
import Blog from './pages/Blog.vue'
import PrivacyPolicy from './pages/PrivacyPolicy.vue'
import CookiesPolicy from './pages/CookiesPolicy.vue'
import GDPRNotice from './pages/GDPRNotice.vue'
import TermsConditions from './pages/TermsConditions.vue'
import Profile from './pages/Profile.vue'
import Preferences from './pages/Preferences.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/login', component: Login },
  { path: '/services', component: Services },
  { path: '/about', component: About },
  { path: '/blog', component: Blog },
  { path: '/privacy-policy', component: PrivacyPolicy },
  { path: '/cookies-policy', component: CookiesPolicy },
  { path: '/gdpr-notice', component: GDPRNotice },
  { path: '/terms-conditions', component: TermsConditions },
  { path: '/profile', component: Profile },
  { path: '/preferences', component: Preferences }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
