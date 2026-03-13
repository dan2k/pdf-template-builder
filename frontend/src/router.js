import { createRouter, createWebHistory } from 'vue-router'
import HomeView from './views/HomeView.vue'
import EditorView from './views/EditorView.vue'
import GenerateView from './views/GenerateView.vue'
import LoginView from './views/LoginView.vue'
import ChangePasswordView from './views/ChangePasswordView.vue'
import AdminView from './views/AdminView.vue'
import { useAuthStore } from './stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/change-password', name: 'change-password', component: ChangePasswordView, meta: { requiresAuth: true } },
    { path: '/admin', name: 'admin', component: AdminView, meta: { requiresAuth: true, requiresAdmin: true } },
    { path: '/', name: 'home', component: HomeView, meta: { guestOk: true } },
    { path: '/editor/:id?', name: 'editor', component: EditorView, meta: { requiresAuth: true } },
    { path: '/generate/:id', name: 'generate', component: GenerateView, meta: { public: true } },
  ],
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // 1. Is the route public?
  if (to.meta.public) {
    if (to.name === 'login' && authStore.isAuthenticated) {
      if (authStore.isFirstLogin) return next('/change-password')
      return next('/')
    }
    return next()
  }

  // 2. Guest-ok routes: accessible without login (read-only mode)
  if (to.meta.guestOk) return next()

  // 3. Not public, so Auth is required
  if (!authStore.isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // 4. User must change password if it's their first login
  if (authStore.isFirstLogin && to.name !== 'change-password') {
    return next('/change-password')
  }

  // 5. Check Admin role if required
  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return next('/')
  }

  // 6. If normal auth flow, let them through
  next()
})

export default router
