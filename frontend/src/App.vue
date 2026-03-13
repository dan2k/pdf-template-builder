<template>
  <div v-if="authStore.isAuthenticated && route.name !== 'generate'" class="app-layout">
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/">PDF Template System</router-link>
        
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span class="navbar-toggler-icon"></span>
        </button>
        
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Dashboard</router-link>
            </li>
            <li class="nav-item" v-if="authStore.isAdmin">
              <router-link class="nav-link" to="/admin">Admin Panel</router-link>
            </li>
          </ul>
          
          <div class="d-flex align-items-center text-white">
            <span class="me-3">
              <i class="bi bi-person-circle me-1"></i>
              {{ authStore.user?.username }} ({{ authStore.user?.department?.name || 'No Dept' }})
            </span>
            <button @click="handleLogout" class="btn btn-sm btn-light">Logout</button>
          </div>
        </div>
      </div>
    </nav>
    <main class="main-content flex-grow-1">
      <RouterView />
    </main>
  </div>
  <div v-else>
    <RouterView />
  </div>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const handleLogout = () => {
  authStore.logout()
}
</script>

<style>
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
</style>
