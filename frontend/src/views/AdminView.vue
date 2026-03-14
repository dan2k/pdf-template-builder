<template>
  <div class="admin-container">
    <div class="admin-header">
      <h2>Admin Panel</h2>
      <p class="text-muted">Manage Users and Departments</p>
    </div>

    <div class="row w-100 max-w-6xl mx-auto mt-4 px-3">
      <!-- Departments Section -->
      <div class="col-md-5 mb-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold">Departments</h5>
            <button class="btn btn-sm btn-primary" @click="openDeptModal()">
              <i class="bi bi-plus-lg"></i> Add
            </button>
          </div>
          <div class="card-body">
            <div v-if="departments.length === 0" class="text-center text-muted py-4">
              No departments found
            </div>
            <ul class="list-group list-group-flush">
              <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-3" v-for="dept in departments" :key="dept.id">
                <div>
                  <div class="fw-bold">{{ dept.name }}</div>
                  <div class="text-xs text-muted">{{ dept.description }}</div>
                </div>
                <div>
                  <button class="btn btn-sm btn-light me-1" @click="openDeptModal(dept)">
                    <i class="bi bi-pencil text-primary"></i>
                  </button>
                  <button class="btn btn-sm btn-light" @click="deleteDept(dept.id)">
                    <i class="bi bi-trash text-danger"></i>
                  </button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <!-- Users Section -->
      <div class="col-md-7 mb-4">
        <div class="card shadow-sm border-0 h-100">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold">Users</h5>
            <button class="btn btn-sm btn-primary" @click="openUserModal()">
              <i class="bi bi-person-plus"></i> Add
            </button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in users" :key="user.id">
                    <td>
                      <div class="fw-bold">{{ user.username }}</div>
                    </td>
                    <td>
                      <span class="badge" :class="user.role === 'admin' ? 'bg-danger' : 'bg-primary'">{{ user.role }}</span>
                    </td>
                    <td>{{ user.department?.name || '—' }}</td>
                    <td>
                      <span v-if="user.isActive" class="text-success"><i class="bi bi-check-circle-fill"></i> Active</span>
                      <span v-else class="text-muted"><i class="bi bi-slash-circle"></i> Disabled</span>
                    </td>
                    <td class="text-end" style="min-width: 140px;">
                      <button class="btn btn-sm btn-light me-1" @click="resetUserPassword(user)" title="Reset Password" v-if="user.id !== authStore.user?.id">
                        <i class="bi bi-key text-warning"></i>
                      </button>
                      <button class="btn btn-sm btn-light me-1" @click="openUserModal(user)" title="Edit">
                        <i class="bi bi-pencil text-primary"></i>
                      </button>
                      <button class="btn btn-sm btn-light" @click="deleteUser(user.id)" title="Delete" :disabled="user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1">
                        <i class="bi bi-trash text-danger"></i>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="users.length === 0" class="text-center text-muted py-4">
                No users found
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row w-100 max-w-6xl mx-auto mt-4 px-3 mb-5">
      <!-- AI Settings Section -->
      <div class="col-12">
        <div class="card shadow-sm border-0">
          <div class="card-header bg-white border-bottom-0 pt-4 pb-0 d-flex justify-content-between align-items-center">
            <h5 class="mb-0 fw-bold">AI Assistant Configuration</h5>
            <button class="btn btn-primary" @click="saveAiProviders" :disabled="aiSaving">
              <span v-if="aiSaving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-cloud-check me-1"></i> Save All AI Config
            </button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover align-middle">
                <thead>
                  <tr>
                    <th width="50">Active</th>
                    <th width="180">Provider</th>
                    <th>API Key / URL Config</th>
                    <th width="200">Default Model</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in aiProviders" :key="p.id">
                    <td class="text-center">
                      <div class="form-check d-flex justify-content-center">
                        <input class="form-check-input" type="radio" :value="p.id" v-model="activeProviderId" @change="updateActiveFlag">
                      </div>
                    </td>
                    <td>
                      <div class="fw-bold">{{ p.name }}</div>
                      <div class="text-xs text-muted">{{ p.id }}</div>
                    </td>
                    <td>
                      <div class="mb-2" v-if="p.id !== 'local'">
                        <label class="text-xs fw-bold text-muted mb-1">API Key</label>
                        <input v-model="p.apiKey" type="password" class="form-control form-control-sm" placeholder="sk-...">
                      </div>
                      <div v-if="p.id === 'openai' || p.id === 'local'">
                        <label class="text-xs fw-bold text-muted mb-1">Base URL / Endpoint</label>
                        <input v-model="p.baseUrl" type="text" class="form-control form-control-sm" :placeholder="p.id === 'local' ? 'http://localhost:11434/api/generate' : 'https://api.openai.com/v1'">
                      </div>
                    </td>
                    <td>
                      <input v-model="p.modelName" type="text" class="form-control form-control-sm" placeholder="e.g. gpt-4o">
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-3 text-xs text-muted bg-light p-2 rounded">
              <i class="bi bi-info-circle-fill me-1 text-primary"></i> 
              เลือก <strong>Active</strong> เพื่อกำหนดว่าต้องการใช้ค่ายไหนเป็นตัวหลักในหน้าการออกแบบ (Editor) โดย API Key จะถูกส่งจาก Server อย่างปลอดภัย
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Dept Modal -->
      <div v-if="showDeptModal" class="modal-bg" @click.self="showDeptModal = false">
        <div class="modal-card">
          <div class="modal-head">
            <h5 class="m-0 fw-bold">{{ deptForm.id ? 'Edit' : 'New' }} Department</h5>
            <button class="btn-close" @click="showDeptModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label text-sm fw-bold text-muted">Name</label>
              <input v-model="deptForm.name" type="text" class="form-control" autofocus>
            </div>
            <div class="mb-3">
              <label class="form-label text-sm fw-bold text-muted">Description</label>
              <textarea v-model="deptForm.description" class="form-control" rows="2"></textarea>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-light" @click="showDeptModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveDept" :disabled="!deptForm.name">Save</button>
          </div>
        </div>
      </div>

      <!-- User Modal -->
      <div v-if="showUserModal" class="modal-bg" @click.self="showUserModal = false">
        <div class="modal-card">
          <div class="modal-head">
            <h5 class="m-0 fw-bold">{{ userForm.id ? 'Edit' : 'New' }} User</h5>
            <button class="btn-close" @click="showUserModal = false"></button>
          </div>
          <div class="modal-body">
            <div class="mb-3">
              <label class="form-label text-sm fw-bold text-muted">Username</label>
              <input v-model="userForm.username" type="text" class="form-control" :disabled="!!userForm.id">
            </div>
            <div class="mb-3" v-if="!userForm.id">
              <label class="form-label text-sm fw-bold text-muted">Password</label>
              <input v-model="userForm.password" type="password" class="form-control">
            </div>
            <div class="row mb-3">
              <div class="col-6">
                <label class="form-label text-sm fw-bold text-muted">Role</label>
                <select v-model="userForm.role" class="form-select">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="col-6">
                <label class="form-label text-sm fw-bold text-muted">Status</label>
                <select v-model="userForm.isActive" class="form-select">
                  <option :value="true">Active</option>
                  <option :value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div class="mb-3">
              <label class="form-label text-sm fw-bold text-muted">Department <span class="fw-normal">(Optional)</span></label>
              <select v-model="userForm.departmentId" class="form-select">
                <option :value="null">None</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="userFormError" class="px-4 pb-2 text-danger text-sm">{{ userFormError }}</div>
          <div class="modal-foot">
            <button class="btn btn-light" @click="showUserModal = false">Cancel</button>
            <button class="btn btn-primary" @click="saveUser" :disabled="!userForm.username || (!userForm.id && !userForm.password)">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import api, { usersApi, settingsApi } from '../api'

const authStore = useAuthStore()
const users = ref([])
const departments = ref([])

const showDeptModal = ref(false)
const deptForm = ref({ id: null, name: '', description: '' })

const showUserModal = ref(false)
const userForm = ref({ id: null, username: '', password: '', role: 'user', isActive: true, departmentId: null })
const userFormError = ref('')

// AI Settings multi-provider
const aiProviders = ref([
  { id: 'gemini',     name: 'Google Gemini',    apiKey: '', modelName: '', isActive: true },
  { id: 'openrouter', name: 'OpenRouter',       apiKey: '', modelName: '', isActive: false },
  { id: 'openai',     name: 'OpenAI/DeepSeek',  apiKey: '', modelName: '', baseUrl: '', isActive: false },
  { id: 'anthropic',  name: 'Anthropic Claude', apiKey: '', modelName: '', isActive: false },
  { id: 'local',      name: 'Local LLM',        apiKey: '', modelName: '', baseUrl: '', isActive: false }
])
const activeProviderId = ref('gemini')
const aiSaving = ref(false)

function updateActiveFlag() {
  aiProviders.value.forEach(p => {
    p.isActive = (p.id === activeProviderId.value)
  })
}

async function loadData() {
  try {
    const [uRes, dRes, sRes] = await Promise.all([
      api.get('/users'),
      api.get('/departments'),
      settingsApi.getProviders()
    ])
    users.value = uRes.data
    departments.value = dRes.data
    
    if (sRes.data && sRes.data.length > 0) {
      // Merge with default list to ensure all providers are shown even if not in DB yet
      aiProviders.value = aiProviders.value.map(def => {
        const saved = sRes.data.find(s => s.id === def.id)
        return saved ? { ...def, ...saved } : def
      })
      activeProviderId.value = aiProviders.value.find(p => p.isActive)?.id || 'gemini'
    }
  } catch (err) {
    console.error('Failed to load admin data', err)
  }
}

onMounted(() => {
  loadData()
})

// Departments
function openDeptModal(dept = null) {
  if (dept) {
    deptForm.value = { ...dept }
  } else {
    deptForm.value = { id: null, name: '', description: '' }
  }
  showDeptModal.value = true
}

async function saveDept() {
  try {
    if (deptForm.value.id) {
      await api.put(`/departments/${deptForm.value.id}`, deptForm.value)
    } else {
      const { id, ...payload } = deptForm.value
      await api.post('/departments', payload)
    }
    await loadData()
    showDeptModal.value = false
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save department')
  }
}

async function deleteDept(id) {
  if (!confirm('Are you sure you want to delete this department?')) return
  try {
    await api.delete(`/departments/${id}`)
    await loadData()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete department')
  }
}

// Users
function openUserModal(user = null) {
  userFormError.value = ''
  if (user) {
    userForm.value = { 
      id: user.id, 
      username: user.username, 
      password: '', // Don't show password
      role: user.role, 
      isActive: user.isActive, 
      departmentId: user.department?.id || null 
    }
  } else {
    userForm.value = { id: null, username: '', password: '', role: 'user', isActive: true, departmentId: null }
  }
  showUserModal.value = true
}

async function saveUser() {
  userFormError.value = ''
  try {
    const payload = { ...userForm.value }
    if (payload.id) {
      delete payload.password // don't update password through this form yet
      await api.put(`/users/${payload.id}`, payload)
    } else {
      await api.post('/users', payload)
    }
    await loadData()
    showUserModal.value = false
  } catch (err) {
    userFormError.value = err.response?.data?.message || 'Failed to save user'
  }
}

async function deleteUser(id) {
  if (!confirm('Are you sure you want to delete this user?')) return
  try {
    await api.delete(`/users/${id}`)
    await loadData()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to delete user')
  }
}

async function resetUserPassword(user) {
  if (!confirm(`Are you sure you want to reset the password for ${user.username}? They will be forced to change it on their next login.`)) return
  try {
    const res = await usersApi.resetPassword(user.id)
    alert(`Password reset successfully!\n\nTemporary Password for ${user.username}: ${res.data.tempPassword}\n\nPlease copy this and provide it securely to the user.`)
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to reset password')
  }
}

async function saveAiProviders() {
  aiSaving.value = true
  try {
    await settingsApi.saveProviders(aiProviders.value)
    alert('AI Provider settings saved successfully!')
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to save settings')
  } finally {
    aiSaving.value = false
  }
}
</script>

<style scoped>
.admin-container {
  padding: 2rem 0;
  background-color: #f8fafc;
  height: calc(100vh - 56px);
  overflow-y: auto;
}
.admin-header {
  text-align: center;
  margin-bottom: 2rem;
}
.max-w-6xl {
  max-width: 72rem;
}
.text-xs {
  font-size: 0.75rem;
}
.text-sm {
  font-size: 0.875rem;
}
.modal-bg { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; z-index:9999; animation:fade-in .15s ease; }
@keyframes fade-in { from{opacity:0} to{opacity:1} }
.modal-card { background:white; border-radius:12px; width:460px; max-width:95vw; box-shadow:0 24px 64px rgba(0,0,0,.2); overflow:hidden; animation:slide-up .18s cubic-bezier(.34,1.56,.64,1); }
@keyframes slide-up { from{transform:translateY(16px);opacity:0} to{transform:translateY(0);opacity:1} }
.modal-head { display:flex; align-items:center; justify-content:space-between; padding:16px 20px; border-bottom:1px solid #f1f5f9; }
.modal-body { padding:20px; }
.modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:12px 20px 16px; border-top:1px solid #f1f5f9; background:#f8fafc; }
</style>
