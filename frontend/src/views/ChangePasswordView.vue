<template>
  <div class="login-container">
    <div class="login-box">
      <div class="login-header">
        <h2>Change Password</h2>
        <p>Please update your default password to continue</p>
      </div>
      
      <form @submit.prevent="handleChangePW" class="login-form">
        <div class="form-group">
          <label for="oldPassword">Current Password</label>
          <input 
            type="password" 
            id="oldPassword" 
            v-model="oldPassword" 
            placeholder="Enter current password" 
            required 
            autofocus
            class="form-control"
          />
        </div>

        <div class="form-group">
          <label for="newPassword">New Password</label>
          <input 
            type="password" 
            id="newPassword" 
            v-model="newPassword" 
            placeholder="Enter new password" 
            required 
            class="form-control"
          />
        </div>
        
        <div class="form-group">
          <label for="confirmPassword">Confirm New Password</label>
          <input 
            type="password" 
            id="confirmPassword" 
            v-model="confirmPassword" 
            placeholder="Confirm new password" 
            required 
            class="form-control"
          />
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>

        <button type="submit" class="btn-primary w-100" :disabled="isLoading">
          <span v-if="isLoading">Updating...</span>
          <span v-else>Update Password</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errorMsg = ref('')
const successMsg = ref('')
const isLoading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

const handleChangePW = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (newPassword.value !== confirmPassword.value) {
    errorMsg.value = 'New passwords do not match'
    return
  }
  
  if (newPassword.value.length < 6) {
    errorMsg.value = 'Password needs to be at least 6 characters'
    return
  }

  isLoading.value = true
  
  try {
    await authStore.changePassword(oldPassword.value, newPassword.value)
    successMsg.value = 'Password updated successfully! Redirecting...'
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    errorMsg.value = err.message || 'Failed to update password'
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
  background-color: #f3f4f6;
}

.login-box {
  background: white;
  padding: 2.5rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.login-header h2 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin-bottom: 0.5rem;
}

.login-header p {
  color: #6b7280;
  font-size: 0.875rem;
}

.login-form .form-group {
  margin-bottom: 1.5rem;
}

.login-form label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease-in-out;
}

.form-control:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.btn-primary {
  background-color: #2563eb;
  color: white;
  padding: 0.625rem 1rem;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.w-100 {
  width: 100%;
}

.error-msg {
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #fef2f2;
  border-radius: 0.25rem;
  border: 1px solid #fecaca;
}

.success-msg {
  color: #059669;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  text-align: center;
  padding: 0.5rem;
  background-color: #ecfdf5;
  border-radius: 0.25rem;
  border: 1px solid #a7f3d0;
}
</style>
