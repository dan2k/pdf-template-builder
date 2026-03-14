<template>
  <div class="admin-container">
    <div class="admin-header">
      <h2 class="text-white">Admin Panel</h2>
      <p class="text-slate-400">Manage Users, Departments and AI Providers</p>
    </div>

    <div class="row w-100 max-w-6xl mx-auto mt-4 px-3">
      <!-- Departments Section -->
      <div class="col-md-5 mb-4">
        <div class="glass-card h-100">
          <div class="card-header-custom border-bottom border-slate-700 pb-3">
            <h5 class="mb-0 fw-bold text-white">Departments</h5>
            <button class="btn-primary-sm" @click="openDeptModal()">
              <i class="bi bi-plus-lg"></i> Add
            </button>
          </div>
          <div class="px-3 pt-3">
            <div class="search-container">
              <i class="bi bi-search"></i>
              <input v-model="deptSearch" type="text" class="dark-input-xs" placeholder="Search departments..." @input="deptPage = 1">
            </div>
          </div>
          <div class="card-body pt-2">
            <div v-if="paginatedDepts.length === 0" class="text-center text-slate-500 py-4">
              No departments found
            </div>
            <ul class="list-group list-group-flush bg-transparent">
              <li class="list-group-item d-flex justify-content-between align-items-center px-0 py-3 bg-transparent border-slate-700" v-for="dept in paginatedDepts" :key="dept.id">
                <div>
                  <div class="fw-bold text-slate-200">{{ dept.name }}</div>
                  <div class="text-xs text-slate-500 mt-1 d-flex align-items-center">
                    <i class="bi bi-justify-left me-1 opacity-50"></i>
                    <span>{{ dept.description || 'No description' }}</span>
                  </div>
                  <div class="mt-1" style="font-size: 9px; color: #475569; letter-spacing: 0.05em;">
                    ID: {{ dept.id }}
                  </div>
                </div>
                <div class="d-flex gap-1">
                  <button class="btn-icon-sm" @click="openDeptModal(dept)">
                    <i class="bi bi-pencil text-primary"></i>
                  </button>
                  <button class="btn-icon-sm" @click="deleteDept(dept.id)">
                    <i class="bi bi-trash text-danger"></i>
                  </button>
                </div>
              </li>
            </ul>
            <!-- Dept Pagination -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-slate-800" v-if="totalDeptPages > 1">
              <span class="text-xs text-slate-500">Page {{ deptPage }} of {{ totalDeptPages }}</span>
              <div class="d-flex gap-2">
                <button class="btn-icon-sm" :disabled="deptPage === 1" @click="deptPage--"><i class="bi bi-chevron-left"></i></button>
                <button class="btn-icon-sm" :disabled="deptPage === totalDeptPages" @click="deptPage++"><i class="bi bi-chevron-right"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Users Section -->
      <div class="col-md-7 mb-4">
        <div class="glass-card h-100">
          <div class="card-header-custom border-bottom border-slate-700 pb-3">
            <h5 class="mb-0 fw-bold text-white">Users</h5>
            <button class="btn-primary-sm" @click="openUserModal()">
              <i class="bi bi-person-plus text-sm"></i> Add
            </button>
          </div>
          <div class="px-3 pt-3">
            <div class="search-container">
              <i class="bi bi-search"></i>
              <input v-model="userSearch" type="text" class="dark-input-xs" placeholder="Search users by name, role, dept..." @input="userPage = 1">
            </div>
          </div>
          <div class="card-body pt-2">
            <div class="table-responsive">
              <table class="table table-dark-custom table-hover align-middle">
                <thead>
                  <tr>
                    <th @click="toggleSort('user', 'username')" class="cursor-pointer">
                      Username <i class="bi ms-1" :class="userSortKey === 'username' ? (userSortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up opacity-25'"></i>
                    </th>
                    <th @click="toggleSort('user', 'role')" class="cursor-pointer">
                      Role <i class="bi ms-1" :class="userSortKey === 'role' ? (userSortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up opacity-25'"></i>
                    </th>
                    <th @click="toggleSort('user', 'department')" class="cursor-pointer">
                      Department <i class="bi ms-1" :class="userSortKey === 'department' ? (userSortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down') : 'bi-arrow-down-up opacity-25'"></i>
                    </th>
                    <th>Status</th>
                    <th class="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="user in paginatedUsers" :key="user.id">
                    <td>
                      <div class="fw-bold text-slate-200">{{ user.username }}</div>
                      <div class="text-[9px] text-slate-600 mt-1 uppercase" style="letter-spacing: 0.02em;">
                        ID: {{ user.id.slice(0, 13) }}...
                      </div>
                    </td>
                    <td>
                      <span class="badge" :class="user.role === 'admin' ? 'bg-danger-soft' : 'bg-primary-soft'">{{ user.role }}</span>
                    </td>
                    <td><span class="text-slate-300">{{ user.department?.name || '—' }}</span></td>
                    <td>
                      <span v-if="user.isActive" class="text-success-soft"><i class="bi bi-check-circle-fill me-1"></i>Active</span>
                      <span v-else class="text-slate-500"><i class="bi bi-slash-circle me-1"></i>Disabled</span>
                    </td>
                    <td class="text-end">
                      <div class="d-flex justify-content-end gap-1">
                        <button class="btn-icon-sm" @click="resetUserPassword(user)" title="Reset Password" v-if="user.id !== authStore.user?.id">
                          <i class="bi bi-key text-warning"></i>
                        </button>
                        <button class="btn-icon-sm" @click="openUserModal(user)" title="Edit">
                          <i class="bi bi-pencil text-primary"></i>
                        </button>
                        <button class="btn-icon-sm" @click="deleteUser(user.id)" title="Delete" :disabled="user.role === 'admin' && users.filter(u => u.role === 'admin').length === 1">
                          <i class="bi bi-trash text-danger"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div v-if="paginatedUsers.length === 0" class="text-center text-slate-500 py-4">
                No users found
              </div>
            </div>

            <!-- User Pagination -->
            <div class="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-slate-800" v-if="totalUserPages > 1">
              <span class="text-xs text-slate-500">Page {{ userPage }} of {{ totalUserPages }}</span>
              <div class="d-flex gap-2">
                <button class="btn-icon-sm" :disabled="userPage === 1" @click="userPage--"><i class="bi bi-chevron-left"></i></button>
                <button class="btn-icon-sm" :disabled="userPage === totalUserPages" @click="userPage++"><i class="bi bi-chevron-right"></i></button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="row w-100 max-w-6xl mx-auto mt-4 px-3 mb-5">
      <!-- AI Settings Section -->
      <div class="col-12">
        <div class="glass-card">
          <div class="card-header-custom border-0">
            <h5 class="mb-0 fw-bold text-white">AI Assistant Configuration</h5>
            <button class="btn-primary-sm px-3 py-2" @click="saveAiProviders" :disabled="aiSaving">
              <span v-if="aiSaving" class="spinner-border spinner-border-sm me-1"></span>
              <i v-else class="bi bi-cloud-check me-1"></i> Save All AI Config
            </button>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-dark-custom table-hover align-middle">
                <thead>
                  <tr>
                    <th width="80" class="text-center">Active</th>
                    <th width="200">Provider</th>
                    <th>API Key / URL Config</th>
                    <th width="250">Default Model</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="p in aiProviders" :key="p.id" :class="{ 'row-active': p.id === activeProviderId }">
                    <td class="text-center">
                      <div class="custom-radio">
                        <input type="radio" :id="'radio-'+p.id" :value="p.id" v-model="activeProviderId" @change="updateActiveFlag">
                        <label :for="'radio-'+p.id"></label>
                      </div>
                    </td>
                    <td>
                      <div class="fw-bold text-slate-200">{{ p.name }}</div>
                      <div class="text-xs text-slate-500">{{ p.id }}</div>
                    </td>
                    <td>
                      <div class="mb-2" v-if="p.id !== 'local'">
                        <label class="input-label-xs">API Key</label>
                        <input v-model="p.apiKey" type="password" class="dark-input-sm" placeholder="sk-...">
                      </div>
                      <div v-if="p.id === 'openai' || p.id === 'local'">
                        <label class="input-label-xs">Base URL / Endpoint</label>
                        <input v-model="p.baseUrl" type="text" class="dark-input-sm" :placeholder="p.id === 'local' ? 'http://localhost:11434/api/generate' : 'https://api.openai.com/v1'">
                      </div>
                    </td>
                    <td>
                       <label class="input-label-xs">Model Name</label>
                       <input v-model="p.modelName" type="text" class="dark-input-sm" placeholder="e.g. gpt-4o">
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="mt-4 info-box">
              <i class="bi bi-info-circle-fill me-2 text-primary"></i> 
              เลือก <strong>Active</strong> เพื่อกำหนดว่าต้องการใช้ค่ายไหนเป็นตัวหลักในหน้าการออกแบบ โดย API Key จะถูกบริหารจัดการที่ฝั่ง Server อย่างปลอดภัย
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals -->
    <Teleport to="body">
      <!-- Dept Modal -->
      <div v-if="showDeptModal" class="modal-bg-custom" @click.self="showDeptModal = false">
        <div class="glass-modal">
          <div class="modal-header-custom">
            <h5 class="m-0 fw-bold text-white">{{ deptForm.id ? 'Edit' : 'New' }} Department</h5>
            <button class="btn-close btn-close-white" @click="showDeptModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-4">
              <label class="dark-label">Department Name</label>
              <input v-model="deptForm.name" type="text" class="dark-input" placeholder="Enter name" autofocus>
            </div>
            <div class="mb-3">
              <label class="dark-label">Description</label>
              <textarea v-model="deptForm.description" class="dark-input" rows="3" placeholder="Enter description"></textarea>
            </div>
          </div>
          <div class="modal-footer-custom">
            <button class="btn-ghost" @click="showDeptModal = false">Cancel</button>
            <button class="btn-primary-sm px-4" @click="saveDept" :disabled="!deptForm.name">Save</button>
          </div>
        </div>
      </div>

      <!-- User Modal -->
      <div v-if="showUserModal" class="modal-bg-custom" @click.self="showUserModal = false">
        <div class="glass-modal">
          <div class="modal-header-custom">
            <h5 class="m-0 fw-bold text-white">{{ userForm.id ? 'Edit' : 'New' }} User</h5>
            <button class="btn-close btn-close-white" @click="showUserModal = false"></button>
          </div>
          <div class="modal-body p-4">
            <div class="mb-4">
              <label class="dark-label">Username</label>
              <input v-model="userForm.username" type="text" class="dark-input" :disabled="!!userForm.id" placeholder="Enter username">
            </div>
            <div class="mb-4" v-if="!userForm.id">
              <label class="dark-label">Password</label>
              <input v-model="userForm.password" type="password" class="dark-input" placeholder="Enter password">
            </div>
            <div class="row g-3 mb-4">
              <div class="col-6">
                <label class="dark-label">Role</label>
                <select v-model="userForm.role" class="dark-select">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="col-6">
                <label class="dark-label">Status</label>
                <select v-model="userForm.isActive" class="dark-select">
                  <option :value="true">Active</option>
                  <option :value="false">Disabled</option>
                </select>
              </div>
            </div>
            <div class="mb-2">
              <label class="dark-label">Department <span class="fw-normal opacity-50">(Optional)</span></label>
              <select v-model="userForm.departmentId" class="dark-select">
                <option :value="null">None</option>
                <option v-for="d in departments" :key="d.id" :value="d.id">{{ d.name }}</option>
              </select>
            </div>
          </div>
          <div v-if="userFormError" class="px-4 pb-3 text-danger-soft text-sm fw-bold"><i class="bi bi-exclamation-triangle-fill me-2"></i>{{ userFormError }}</div>
          <div class="modal-footer-custom">
            <button class="btn-ghost" @click="showUserModal = false">Cancel</button>
            <button class="btn-primary-sm px-4" @click="saveUser" :disabled="!userForm.username || (!userForm.id && !userForm.password)">Save</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
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

// Pagination, Sorting, Filtering
const ITEMS_PER_PAGE = 5

// Departments State
const deptSearch = ref('')
const deptPage = ref(1)
const deptSortKey = ref('name')
const deptSortOrder = ref('asc')

const filteredDepts = computed(() => {
  let result = departments.value.filter(d => 
    d.name.toLowerCase().includes(deptSearch.value.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(deptSearch.value.toLowerCase())
  )
  
  result.sort((a, b) => {
    const valA = a[deptSortKey.value] || ''
    const valB = b[deptSortKey.value] || ''
    let cmp = 0
    if (valA < valB) cmp = -1
    else if (valA > valB) cmp = 1
    return deptSortOrder.value === 'asc' ? cmp : -cmp
  })
  
  return result
})

const paginatedDepts = computed(() => {
  const start = (deptPage.value - 1) * ITEMS_PER_PAGE
  return filteredDepts.value.slice(start, start + ITEMS_PER_PAGE)
})

const totalDeptPages = computed(() => Math.ceil(filteredDepts.value.length / ITEMS_PER_PAGE) || 1)

// Users State
const userSearch = ref('')
const userPage = ref(1)
const userSortKey = ref('username')
const userSortOrder = ref('asc')

const filteredUsers = computed(() => {
  let result = users.value.filter(u => 
    u.username.toLowerCase().includes(userSearch.value.toLowerCase()) ||
    u.role.toLowerCase().includes(userSearch.value.toLowerCase()) ||
    (u.department?.name || '').toLowerCase().includes(userSearch.value.toLowerCase())
  )

  result.sort((a, b) => {
    let valA, valB
    if (userSortKey.value === 'department') {
      valA = a.department?.name || ''
      valB = b.department?.name || ''
    } else {
      valA = a[userSortKey.value] || ''
      valB = b[userSortKey.value] || ''
    }
    
    let cmp = 0
    if (valA < valB) cmp = -1
    else if (valA > valB) cmp = 1
    return userSortOrder.value === 'asc' ? cmp : -cmp
  })

  return result
})

const paginatedUsers = computed(() => {
  const start = (userPage.value - 1) * ITEMS_PER_PAGE
  return filteredUsers.value.slice(start, start + ITEMS_PER_PAGE)
})

const totalUserPages = computed(() => Math.ceil(filteredUsers.value.length / ITEMS_PER_PAGE) || 1)

function toggleSort(type, key) {
  if (type === 'user') {
    if (userSortKey.value === key) {
      userSortOrder.value = userSortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      userSortKey.value = key
      userSortOrder.value = 'asc'
    }
  } else {
    if (deptSortKey.value === key) {
      deptSortOrder.value = deptSortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
      deptSortKey.value = key
      deptSortOrder.value = 'asc'
    }
  }
}

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
  padding: 2.5rem 0;
  background-color: #0f172a;
  background-image: radial-gradient(circle at top right, #1e293b, #0f172a);
  height: calc(100vh - 56px);
  overflow-y: auto;
}

.admin-header {
  text-align: center;
  margin-bottom: 3rem;
}

.admin-header h2 {
  font-weight: 700;
  letter-spacing: -0.02em;
}

.text-slate-400 { color: #94a3b8; }
.text-slate-500 { color: #64748b; }
.text-slate-300 { color: #cbd5e1; }
.text-slate-200 { color: #e2e8f0; }

.max-w-6xl {
  max-width: 72rem;
}

.glass-card {
  background: #1e293b;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.card-header-custom {
  padding: 1.5rem 1.5rem 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-body {
  padding: 1.5rem;
}

/* Buttons */
.btn-primary-sm {
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.btn-primary-sm:hover:not(:disabled) {
  background: #3b82f6;
  transform: translateY(-1px);
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3);
}

.btn-icon-sm {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid #334155;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  color: #94a3b8;
}

.btn-icon-sm:hover {
  background: #1e293b;
  border-color: #475569;
  color: #fff;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #334155;
  color: #cbd5e1;
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-ghost:hover {
  background: rgba(255,255,255,0.05);
  color: #fff;
}

/* Tables */
.table-dark-custom {
  --bs-table-bg: transparent;
  --bs-table-color: #cbd5e1;
  --bs-table-hover-bg: rgba(255,255,255,0.02);
  --bs-table-border-color: rgba(255,255,255,0.05);
  margin-bottom: 0;
}

.table-dark-custom thead th {
  background: rgba(255,255,255,0.02);
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
  padding: 1rem 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.table-dark-custom tbody td {
  padding: 1rem 0.75rem;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.row-active {
  background: rgba(37, 99, 235, 0.05) !important;
}

/* Badges */
.badge {
  padding: 0.4em 0.8em;
  font-weight: 600;
  border-radius: 6px;
}
.bg-danger-soft { background: rgba(239, 68, 68, 0.15); color: #f87171; }
.bg-primary-soft { background: rgba(37, 99, 235, 0.15); color: #60a5fa; }
.text-success-soft { color: #34d399; }
.text-danger-soft { color: #f87171; }

/* Inputs */
.dark-label {
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-label-xs {
  font-size: 10px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 4px;
  display: block;
}

.dark-input, .dark-input-sm, .dark-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 10px;
  color: #fff;
  transition: all 0.2s;
}

.dark-input-sm {
  padding: 0.4rem 0.75rem;
  font-size: 0.875rem;
  border-radius: 8px;
}

.dark-select {
  padding-right: 2.5rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 12px;
}

.dark-input:focus, .dark-input-sm:focus, .dark-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15);
}

/* Modals */
.modal-bg-custom {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.glass-modal {
  background: #1e293b;
  border-radius: 20px;
  width: 480px;
  max-width: 95vw;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  animation: modal-up 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes modal-up {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header-custom {
  padding: 1.5rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-footer-custom {
  padding: 1.25rem 1.5rem;
  background: rgba(15, 23, 42, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* Info Box */
.info-box {
  background: rgba(37, 99, 235, 0.1);
  border: 1px solid rgba(37, 99, 235, 0.2);
  border-radius: 12px;
  padding: 1rem;
  font-size: 0.8rem;
  color: #94a3b8;
  line-height: 1.5;
}

/* Custom Radio */
.custom-radio {
  display: inline-block;
  position: relative;
  width: 20px;
  height: 20px;
}
.custom-radio input {
  opacity: 0;
  position: absolute;
}
.custom-radio label {
  position: absolute;
  top: 0; left: 0;
  width: 20px; height: 20px;
  background: #0f172a;
  border: 2px solid #334155;
  border-radius: 50%;
  cursor: pointer;
}
.custom-radio label::after {
  content: '';
  position: absolute;
  top: 4px; left: 4px;
  width: 8px; height: 8px;
  background: #3b82f6;
  border-radius: 50%;
  opacity: 0;
  transform: scale(0.5);
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.custom-radio input:checked + label {
  border-color: #3b82f6;
}
.custom-radio input:checked + label::after {
  opacity: 1;
  transform: scale(1);
}

.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }

/* Table Enhancements */
.cursor-pointer { cursor: pointer; }
.cursor-pointer:hover { color: #f8fafc !important; }

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}
.search-container i {
  position: absolute;
  left: 12px;
  color: #64748b;
  font-size: 0.85rem;
}
.dark-input-xs {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.25rem;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #fff;
  font-size: 0.8rem;
  transition: all 0.2s;
}
.dark-input-xs:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-icon-sm:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
