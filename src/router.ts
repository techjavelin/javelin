import { createRouter, createWebHistory } from 'vue-router'
import App from '../App.vue'
import Login from '../pages/Login.vue'

const routes = [
  { path: '/', component: App },
  { path: '/login', component: Login }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
