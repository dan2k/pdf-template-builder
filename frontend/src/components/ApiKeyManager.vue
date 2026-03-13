<template>
  <div class="api-key-manager mt-4 border-top pt-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h6 class="mb-0 fw-bold"><i class="bi bi-key-fill text-warning me-2"></i>API Keys</h6>
      <button class="btn btn-sm btn-outline-primary" @click="showCreateForm = !showCreateForm">
        <i class="bi bi-plus-lg"></i> Generate Key
      </button>
    </div>

    <!-- Create Form -->
    <div v-if="showCreateForm" class="bg-light p-3 rounded mb-3 border">
      <label class="form-label text-sm fw-bold text-muted">Key Label (Optional)</label>
      <div class="input-group input-group-sm">
        <input v-model="newKeyLabel" type="text" class="form-control" placeholder="e.g. Production Server" @keyup.enter="generateKey" autofocus>
        <button class="btn btn-primary" @click="generateKey" :disabled="isGenerating">
          <span v-if="isGenerating" class="spinner-border spinner-border-sm"></span>
          <span v-else>Generate</span>
        </button>
      </div>
    </div>

    <!-- New Key Display (Only shown once) -->
    <div v-if="newlyGeneratedKey" class="alert alert-success d-flex flex-column mb-3">
      <div class="d-flex align-items-start mb-2">
        <i class="bi bi-check-circle-fill me-2 fs-5"></i>
        <div>
          <strong>Key Generated Successfully!</strong>
          <p class="mb-0 text-sm">Please copy this key now. You will not be able to see it again.</p>
        </div>
      </div>
      <div class="input-group">
        <input type="text" class="form-control font-monospace text-sm font-bold bg-white" readonly :value="newlyGeneratedKey">
        <button class="btn btn-outline-success" @click="copyToClipboard(newlyGeneratedKey)">
          <i class="bi bi-clipboard"></i> Copy
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center py-3 text-muted text-sm">
      <div class="spinner-border spinner-border-sm me-2"></div> Loading keys...
    </div>

    <!-- Key List -->
    <div v-else class="key-list">
      <div v-if="keys.length === 0" class="text-center text-muted text-sm py-3 bg-light rounded border-dashed">
        No API keys generated for this template yet.
      </div>
      <ul v-else class="list-group list-group-flush border rounded">
        <li v-for="k in keys" :key="k.id" class="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
          <div>
            <div class="d-flex align-items-center">
              <span class="font-monospace text-sm me-2 bg-light px-2 py-1 rounded border">{{ k.prefix }}</span>
              <span v-if="!k.isActive" class="badge bg-secondary text-xs">Revoked</span>
            </div>
            <div class="text-xs text-muted mt-1">
              {{ k.label || 'Unnamed Key' }} • Created {{ new Date(k.createdAt).toLocaleDateString() }}
            </div>
          </div>
          <button class="btn btn-sm btn-light text-danger" title="Revoke Key" @click="revokeKey(k.id)" :disabled="!k.isActive">
            <i class="bi bi-trash"></i>
          </button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import api from '../api'

const props = defineProps({
  templateId: {
    type: String,
    required: true
  }
})

const keys = ref([])
const isLoading = ref(false)
const showCreateForm = ref(false)
const newKeyLabel = ref('')
const newlyGeneratedKey = ref(null)
const isGenerating = ref(false)

const loadKeys = async () => {
  if (!props.templateId) return
  isLoading.value = true
  try {
    const res = await api.get(`/api-keys?templateId=${props.templateId}`)
    keys.value = res.data
  } catch (err) {
    console.error('Failed to load API keys', err)
  } finally {
    isLoading.value = false
  }
}

watch(() => props.templateId, (newId) => {
  if (newId) {
    newlyGeneratedKey.value = null
    showCreateForm.value = false
    loadKeys()
  }
})

onMounted(() => {
  loadKeys()
})

const generateKey = async () => {
  isGenerating.value = true
  try {
    const res = await api.post('/api-keys', {
      templateId: props.templateId,
      label: newKeyLabel.value
    })
    newlyGeneratedKey.value = res.data.key
    newKeyLabel.value = ''
    showCreateForm.value = false
    await loadKeys()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to generate key')
  } finally {
    isGenerating.value = false
  }
}

const revokeKey = async (id) => {
  if (!confirm('Are you sure you want to revoke this API key? Systems using it will immediately lose access.')) return
  try {
    await api.delete(`/api-keys/${id}`)
    await loadKeys()
  } catch (err) {
    alert(err.response?.data?.message || 'Failed to revoke key')
  }
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text).then(() => {
    // Optional: show a small toast or change copy button icon
  }).catch(err => {
    console.error('Failed to copy', err)
  })
}
</script>

<style scoped>
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.border-dashed { border: 1px dashed #dee2e6; }
</style>
