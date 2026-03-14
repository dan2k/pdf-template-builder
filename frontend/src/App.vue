<template>
  <div v-if="authStore.isAuthenticated && route.name !== 'generate'" class="app-layout">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div class="container-fluid px-4">
        <router-link class="navbar-brand d-flex align-items-center" to="/">
          <i class="bi bi-file-earmark-pdf-fill me-2"></i>
          <span class="fw-bold">PDF Template System</span>
        </router-link>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto ms-3">
            <li class="nav-item">
              <router-link class="nav-link px-3" to="/">Dashboard</router-link>
            </li>
            <li class="nav-item" v-if="authStore.isAdmin">
              <router-link class="nav-link px-3" to="/admin">Admin Panel</router-link>
            </li>
          </ul>
          
          <div class="d-flex align-items-center gap-3">
            <div class="user-pill-blue d-none d-md-flex align-items-center">
              <i class="bi bi-person-circle"></i>
              <span class="user-text ms-2 fw-medium">
                {{ authStore.user?.username }}
                <span class="dept-label-light">· {{ authStore.user?.department?.name || 'No Dept' }}</span>
              </span>
            </div>
            <button @click="handleLogout" class="btn btn-sm btn-light fw-bold px-3">
              <i class="bi bi-box-arrow-right me-1"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
    <main class="main-content flex-grow-1">
      <RouterView />
    </main>

    <!-- Global Toast -->
    <Transition name="toast">
      <div v-if="toast.show" class="toast-popup" :class="toast.type">
        <i :class="toast.type === 'success' ? 'bi bi-check-circle-fill' : 'bi bi-exclamation-circle-fill'"></i>
        <span>{{ toast.message }}</span>
      </div>
    </Transition>
  </div>
  <div v-else>
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { ref, onMounted, onUnmounted } from 'vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const toast = ref({ show: false, message: '', type: 'success' })
let toastTimer = null

const handleToast = (e) => {
  const { message, type } = e.detail
  toast.value = { show: true, message: message || '', type: type || 'success' }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value.show = false }, 3000)
}

onMounted(() => {
  window.addEventListener('app-toast', handleToast)
})
onUnmounted(() => {
  window.removeEventListener('app-toast', handleToast)
  if (toastTimer) clearTimeout(toastTimer)
})

const handleLogout = () => {
  authStore.logout()
}
</script>

<style>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: #0f172a;
}
.navbar-brand {
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}
.nav-link {
  font-size: 0.95rem;
  font-weight: 500;
  transition: opacity 0.2s;
}
.nav-link:hover {
  opacity: 0.8;
}
.user-pill-blue {
  background: rgba(255, 255, 255, 0.15);
  padding: 5px 15px;
  border-radius: 50px;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
}
.user-text {
  font-size: 0.85rem;
}
.dept-label-light {
  font-size: 0.75rem;
  opacity: 0.8;
}

/* Toast */
.toast-popup {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.9);
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 99999;
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
  border: 1px solid #334155;
  backdrop-filter: blur(8px);
}
.toast-popup.success { border-color: #10b981; }
.toast-popup.success i { color: #10b981; }
.toast-popup.error { border-color: #ef4444; }
.toast-popup.error i { color: #ef4444; }

.toast-enter-active, .toast-leave-active { transition: all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28); }
.toast-enter-from { transform: translate(-50%, 20px); opacity: 0; }
.toast-leave-to { transform: translate(-50%, 20px); opacity: 0; }
</style>
