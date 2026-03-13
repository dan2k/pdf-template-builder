<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-branding">
        <div class="logo-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div>
        <span class="logo-text">PDF Template Builder</span>
      </div>
      
      <div class="login-header">
        <p>Sign in to your account</p>
      </div>
      
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">Username</label>
          <input 
            type="text" 
            id="username" 
            v-model="username" 
            placeholder="Enter username" 
            required 
            autofocus
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Password</label>
          <input 
            type="password" 
            id="password" 
            v-model="password" 
            placeholder="Enter password" 
            required 
            class="form-control"
          />
        </div>

        <div v-if="errorMsg" class="error-msg-container">
          <div class="error-msg">{{ errorMsg }}</div>
        </div>

        <div class="guest-link mb-4 text-center">
          <router-link to="/" class="link-secondary">Go to Dashboard (Guest Mode)</router-link>
        </div>

        <button type="submit" class="btn-primary w-100" :disabled="isLoading">
          <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
          <span>{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const isLoading = ref(false)

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const handleLogin = async () => {
  errorMsg.value = ''
  isLoading.value = true
  
  try {
    await authStore.login(username.value, password.value)
    
    // Check if they need to change password
    if (authStore.isFirstLogin) {
      router.push('/change-password')
    } else {
      // Go to requested route or home
      const redirectPath = route.query.redirect || '/'
      router.push(redirectPath)
    }
  } catch (err) {
    errorMsg.value = err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #0f172a;
  background-image: radial-gradient(circle at top right, #1e293b, #0f172a);
}

.login-box {
  background: #1e293b;
  padding: 3rem 2.5rem;
  border-radius: 16px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 420px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.login-branding {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 0.75rem;
}

.logo-icon {
  width: 42px;
  height: 42px;
  background: #2563eb;
  color: white;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
}

.logo-text {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.02em;
}

.login-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.login-header p {
  color: #94a3b8;
  font-size: 0.95rem;
}

.login-form .form-group {
  margin-bottom: 1.5rem;
}

.login-form label {
  display: block;
  font-size: 0.85rem;
  font-weight: 600;
  color: #cbd5e1;
  margin-bottom: 0.6rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #334155;
  background: #0f172a;
  border-radius: 10px;
  font-size: 1rem;
  color: #ffffff;
  transition: all 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
  background: #0f172a;
  color: #ffffff;
}

/* Fix for browser autofill */
.form-control:-webkit-autofill,
.form-control:-webkit-autofill:hover, 
.form-control:-webkit-autofill:focus, 
.form-control:-webkit-autofill:active {
  -webkit-box-shadow: 0 0 0 30px #0f172a inset !important;
  -webkit-text-fill-color: #ffffff !important;
  caret-color: white;
}

.form-control::placeholder {
  color: #475569;
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.875rem 1rem;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.btn-primary:hover:not(:disabled) {
  background-color: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.w-100 {
  width: 100%;
}

.error-msg-container {
  margin-bottom: 1.5rem;
}

.error-msg {
  color: #f87171;
  font-size: 0.875rem;
  padding: 0.75rem 1rem;
  background-color: rgba(127, 29, 29, 0.3);
  border-radius: 10px;
  border: 1px solid rgba(248, 113, 113, 0.2);
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-msg::before {
  content: '\F33A';
  font-family: 'bootstrap-icons';
}

.guest-link {
  font-size: 0.875rem;
}

.link-secondary {
  color: #94a3b8;
  text-decoration: none;
  transition: color 0.2s;
  font-weight: 500;
}

.link-secondary:hover {
  color: #3b82f6;
  text-decoration: underline;
}
</style>
