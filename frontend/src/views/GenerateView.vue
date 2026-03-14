<template>
  <div class="generate-layout">
    <header class="app-header navbar navbar-dark bg-primary shadow-sm px-4">
      <div class="d-flex align-items-center">
        <router-link class="navbar-brand d-flex align-items-center me-0" to="/">
           <i class="bi bi-file-earmark-pdf-fill me-2"></i>
           <span class="fw-bold">PDF Template System</span>
        </router-link>
        
        <div class="vr mx-3 text-white opacity-25" style="height: 24px;"></div>

        <div class="d-flex align-items-center gap-2">
          <router-link :to="canEdit ? `/editor/${templateId}` : '/'" class="nav-link text-white opacity-75 hover-white px-2">
            <i class="bi bi-arrow-left me-1"></i>{{ canEdit ? 'Back to Editor' : 'Back to Dashboard' }}
          </router-link>
          <span class="nav-link text-white fw-bold px-2">
            <i class="bi bi-file-earmark-arrow-down-fill me-1"></i>Generate PDF
          </span>
        </div>
      </div>
      <router-link to="/" class="btn btn-sm btn-light fw-bold px-3">
        <i class="bi bi-house me-1"></i>Home
      </router-link>
    </header>

    <div class="generate-body">
      <div class="generate-main">
        <!-- Template info -->
        <div class="card mb-4 border-0 shadow-sm" v-if="template">
          <div class="card-body p-4">
            <div class="d-flex align-items-start gap-4">
              <div class="template-icon shadow-sm">
                <i class="bi bi-file-earmark-pdf-fill"></i>
              </div>
              <div class="flex-grow-1">
                <div class="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h4 class="mb-1 text-white fw-bold">{{ template.name }}</h4>
                    <div class="text-muted small d-flex align-items-center gap-2 mb-2">
                       <span class="badge bg-primary-subtle text-primary border border-primary-subtle">
                         <i class="bi bi-file-earmark-fill me-1"></i>{{ template.pages?.length || 0 }} page(s)
                       </span>
                       <span class="badge bg-info-subtle text-info border border-info-subtle">
                         <i class="bi bi-braces me-1"></i>{{ (template.variables || []).length }} variable(s)
                       </span>
                    </div>
                  </div>
                  <div class="text-end">
                    <div class="d-flex align-items-center gap-2 mb-1">
                      <code class="text-primary-emphasis bg-primary-subtle border border-primary-subtle px-2 py-1 rounded small">ID: {{ template.id }}</code>
                      <button @click="copyToClipboard(template.id, 'id')" class="btn btn-sm btn-ghost p-1" :title="copiedLabel === 'id' ? 'Copied!' : 'Copy ID'">
                        <i class="bi" :class="copiedLabel === 'id' ? 'bi-check2 text-success' : 'bi-clipboard'"></i>
                      </button>
                    </div>
                    <div class="small text-muted">
                      <div><i class="bi bi-plus-circle me-1"></i>Created: {{ formatDate(template.createdAt) }}</div>
                      <div><i class="bi bi-pencil-square me-1"></i>Updated: {{ formatDate(template.updatedAt) }}</div>
                    </div>
                  </div>
                </div>
                
                <p v-if="template.description" class="text-secondary small mb-3 border-start border-primary-subtle ps-3 py-1">
                  {{ template.description }}
                </p>

                <div class="d-flex align-items-center gap-3 pt-3 border-top border-white border-opacity-10">
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-sm">
                      <i class="bi bi-person-circle"></i>
                    </div>
                    <div>
                      <div class="small fw-semibold text-white">{{ template.user?.username || 'Unknown User' }}</div>
                      <div class="text-muted smaller">Owner</div>
                    </div>
                  </div>
                  <div class="vr opacity-25" style="height: 20px;"></div>
                  <div class="d-flex align-items-center gap-2">
                    <div class="avatar-sm text-info">
                      <i class="bi bi-building"></i>
                    </div>
                    <div>
                      <div class="small fw-semibold text-white">{{ template.user?.department?.name || 'No Department' }}</div>
                      <div class="text-muted smaller">Department</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- JSON Data input -->
        <div class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-braces text-primary"></i>
              <span class="fw-semibold">Input Data (JSON)</span>
            </div>
            <div class="d-flex gap-2">
              <button class="btn btn-sm btn-outline-secondary" @click="formatJson">
                <i class="bi bi-magic me-1"></i>Format
              </button>
              <button class="btn btn-sm btn-outline-secondary" @click="loadSampleData">
                <i class="bi bi-lightning me-1"></i>Sample
              </button>
            </div>
          </div>
          <div class="card-body p-0">
            <div class="json-editor-wrap">
              <textarea
                v-model="jsonInput"
                class="json-editor"
                placeholder='{ "name": "John Doe", "items": [...] }'
                spellcheck="false"
              ></textarea>
            </div>
            <div v-if="jsonError" class="px-3 py-2 bg-danger-subtle text-danger small">
              <i class="bi bi-exclamation-triangle me-1"></i>{{ jsonError }}
            </div>
          </div>
        </div>

        <!-- Variables reference -->
        <div v-if="template?.variables?.length" class="card border-0 shadow-sm mb-4">
          <div class="card-header bg-white border-bottom">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-info-circle text-info"></i>
              <span class="fw-semibold">Available Variables</span>
            </div>
          </div>
          <div class="card-body p-0">
            <table class="table table-sm mb-0">
              <thead class="table-light">
                <tr>
                  <th>Variable</th>
                  <th>Type</th>
                  <th>Default</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="v in template.variables" :key="v.name">
                  <td><code>&#123;&#123;{{ v.name }}&#125;&#125;</code></td>
                  <td><span class="badge bg-light text-dark">{{ v.type }}</span></td>
                  <td class="text-muted">{{ v.defaultValue || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="d-flex gap-3">
          <button class="btn btn-outline-primary flex-fill" @click="previewPdf" :disabled="generating">
            <span v-if="generating === 'preview'" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-eye me-2"></i>Preview
          </button>
          <button class="btn btn-success flex-fill" @click="downloadPdf" :disabled="generating">
            <span v-if="generating === 'download'" class="spinner-border spinner-border-sm me-2"></span>
            <i v-else class="bi bi-download me-2"></i>Download PDF
          </button>
        </div>

        <!-- API Example -->
        <div class="card border-0 shadow-sm mt-4">
          <div class="card-header bg-white border-bottom d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-code-slash text-secondary"></i>
              <span class="fw-semibold">API Usage</span>
            </div>
            <div class="btn-group btn-group-sm">
              <button 
                class="btn btn-outline-secondary" 
                :class="{ active: apiMode === 'file' }"
                @click="apiMode = 'file'"
              >PDF File</button>
              <button 
                class="btn btn-outline-secondary" 
                :class="{ active: apiMode === 'base64' }"
                @click="apiMode = 'base64'"
              >Base64 JSON</button>
            </div>
          </div>
          <div class="card-body">
            <div v-if="apiMode === 'file'" class="mb-3">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-success-subtle text-success">PDF Binary</span>
                <span class="small text-muted">ได้รับไฟล์ทันที</span>
              </div>
              <p class="small text-muted mb-0">เหมาะสำหรับการ <strong>Download</strong> หรือทดสอบผ่าน <code>curl</code> โดยใช้ <code>--output</code> เพื่อบันทึกไฟล์ลงเครื่อง</p>
            </div>
            <div v-else class="mb-3">
              <div class="d-flex align-items-center gap-2 mb-1">
                <span class="badge bg-primary-subtle text-primary">JSON Base64</span>
                <span class="small text-muted">ได้รับข้อความ (String)</span>
              </div>
              <p class="small text-muted mb-0">เหมาะสำหรับ <strong>Programmer</strong> นำไปเรียกผ่าน Code โดยเพิ่ม <code>"responseType": "base64"</code> ใน JSON เพื่อรับค่าไปประมวลผลต่อ (เช่น ส่ง Email หรือแสดงผลบน Web)</p>
            </div>
            
            <pre class="api-code">POST {{ apiUrl }}/templates/{{ templateId }}/generate
Content-Type: application/json
X-API-Key: YOUR_API_KEY

{{ apiFullExample }}</pre>
            
            <div class="d-flex justify-content-between align-items-center mt-3">
              <div class="small text-secondary">
                <span v-if="apiMode === 'file'">ใช้ <code>--output</code> เพื่อบันทึกเป็นไฟล์</span>
                <span v-else>ได้รับ JSON <code>{ "base64": "..." }</code></span>
              </div>
              <button class="btn btn-primary btn-sm" @click="copyApiExample">
                <i class="bi bi-clipboard me-1"></i>Copy cURL
              </button>
            </div>

            <hr class="my-3 opacity-25">
            
            <div class="api-params-guide">
              <div class="row g-2">
                <div class="col-sm-6">
                  <div 
                    class="p-2 border rounded-3 bg-light h-100 api-card" 
                    :class="{ 'border-primary shadow-sm': apiMode === 'file' }"
                    @click="apiMode = 'file'"
                    style="cursor: pointer;"
                  >
                    <div class="fw-bold small mb-1 text-dark"><i class="bi bi-key-fill me-1 text-warning"></i> Authentication</div>
                    <div class="small text-muted">ต้องส่ง Header <code>X-API-Key</code> ทุกครั้ง (สร้างได้ในหน้า Template Settings)</div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div 
                    class="p-2 border rounded-3 bg-light h-100 api-card" 
                    :class="{ 'border-primary shadow-sm': apiMode === 'base64' }"
                    @click="apiMode = 'base64'" 
                    style="cursor: pointer;"
                  >
                    <div class="fw-bold small mb-1 text-dark"><i class="bi bi-gear-fill me-1 text-primary"></i> Response Type</div>
                    <div class="small text-muted">ระบุ <code>"responseType": "base64"</code> ใน JSON หากต้องการค่าเป็น String (Base64)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PDF Preview panel -->
      <div class="preview-panel" v-if="previewUrl">
        <div class="preview-panel-header">
          <span class="fw-semibold">Preview</span>
          <button class="toolbar-btn" @click="previewUrl = null"><i class="bi bi-x"></i></button>
        </div>
        <iframe :src="previewUrl" class="pdf-frame"></iframe>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { templatesApi, generateApi } from '../api'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const authStore = useAuthStore()
const templateId = route.params.id
const template = ref(null)
const jsonInput = ref('{}')
const jsonError = ref('')
const generating = ref(null)
const previewUrl = ref(null)
const apiMode = ref('file') // 'file' or 'base64'
const copiedLabel = ref(null)

const canEdit = computed(() => {
  if (!authStore.isAuthenticated) return false
  if (authStore.isAdmin) return true
  return template.value && (template.value.userId === authStore.user?.id)
})

const apiUrl = window.location.origin === 'http://localhost:5173'
  ? 'http://localhost:3000'
  : window.location.origin

const apiFullExample = computed(() => {
  const data = parsedData.value ? { ...parsedData.value } : {}
  if (apiMode.value === 'base64') {
    data.responseType = 'base64'
  }
  return JSON.stringify(data, null, 2)
})

const parsedData = computed(() => {
  try {
    jsonError.value = ''
    return JSON.parse(jsonInput.value)
  } catch (e) {
    jsonError.value = e.message
    return null
  }
})

onMounted(async () => {
  try {
    const res = await templatesApi.getOne(templateId)
    template.value = res.data
    loadSampleData()
  } catch (e) { console.error(e) }
})

function loadSampleData() {
  if (!template.value) return
  const sample = {}
  for (const v of (template.value.variables || [])) {
    if (v.type === 'array') {
      sample[v.name] = [
        { name: 'Item 1', value: '100', note: 'Sample' },
        { name: 'Item 2', value: '200', note: 'Sample' },
        { name: 'Item 3', value: '300', note: 'Sample' },
      ]
    } else if (v.type === 'number') {
      sample[v.name] = v.defaultValue || 42
    } else if (v.type === 'date') {
      sample[v.name] = new Date().toLocaleDateString('th-TH')
    } else {
      sample[v.name] = v.defaultValue || `Sample ${v.name}`
    }
  }
  jsonInput.value = JSON.stringify(sample, null, 2)
}

function formatJson() {
  try {
    jsonInput.value = JSON.stringify(JSON.parse(jsonInput.value), null, 2)
    jsonError.value = ''
  } catch (e) {
    jsonError.value = e.message
  }
}

async function previewPdf() {
  if (!parsedData.value || generating.value) return
  generating.value = 'preview'
  try {
    const res = await generateApi.preview(templateId, parsedData.value)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    previewUrl.value = URL.createObjectURL(blob)
  } catch (e) {
    alert('Error: ' + e.message)
  } finally {
    generating.value = null
  }
}

async function downloadPdf() {
  if (!parsedData.value || generating.value) return
  generating.value = 'download'
  try {
    const res = await generateApi.generate(templateId, parsedData.value)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.value?.name || 'document'}-${Date.now()}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    alert('Error: ' + e.message)
  } finally {
    generating.value = null
  }
}

function copyApiExample() {
  const data = parsedData.value ? { ...parsedData.value } : {}
  if (apiMode.value === 'base64') {
    data.responseType = 'base64'
  }
  
  let code = `curl -X POST ${apiUrl}/templates/${templateId}/generate \\\n` +
             `  -H "X-API-Key: YOUR_API_KEY" \\\n` +
             `  -H "Content-Type: application/json" \\\n` +
             `  -d '${JSON.stringify(data)}'`
             
  if (apiMode.value === 'file') {
    code += ` \\\n  --output generated.pdf`
  }
  
  navigator.clipboard.writeText(code)
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short'
  })
}

function copyToClipboard(text, label) {
  navigator.clipboard.writeText(text)
  copiedLabel.value = label
  setTimeout(() => {
    if (copiedLabel.value === label) copiedLabel.value = null
  }, 2000)
}
</script>

<style scoped>
.generate-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #111827;
  color: #f1f5f9;
}

.app-header {
  height: 56px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  flex-shrink: 0;
  z-index: 100;
}

.navbar-brand {
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}

.hover-white:hover {
  opacity: 1 !important;
  color: white !important;
}

.nav-link {
  font-size: 0.9rem;
  transition: all 0.2s;
}

.btn-ghost {
  background: transparent; border: none;
  color: #94a3b8; padding: 6px 12px; border-radius: 8px;
  display: flex; align-items: center;
}
.btn-ghost:hover { background: rgba(255,255,255,0.05); color: #f1f5f9; }

.btn-outline-secondary { border-color: #334155; color: #94a3b8; }
.btn-outline-secondary:hover { border-color: #475569; background: #1e293b; color: #f8fafc; }

.generate-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  gap: 0;
}

.generate-main {
  flex: 1;
  overflow-y: auto;
  padding: 32px;
  max-width: 800px;
}

.card {
  background: rgba(30, 41, 59, 0.4);
  backdrop-filter: blur(12px);
  border: 1px solid #334155 !important;
  border-radius: 16px;
  color: #f1f5f9;
}

.card-header {
  background: rgba(0,0,0,0.2) !important;
  border-bottom: 1px solid #334155 !important;
  color: #f8fafc !important;
  padding: 14px 20px;
}

.template-icon {
  width: 64px; height: 64px;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.1));
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  color: #f87171;
  font-size: 28px;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.avatar-sm {
  width: 32px; height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #94a3b8;
  font-size: 16px;
}

.smaller { font-size: 0.75rem; }

.text-muted { color: #94a3b8 !important; }
.bg-white { background: transparent !important; }

.json-editor-wrap {
  background: #1e1e2e;
  border-radius: 0;
}

.json-editor {
  width: 100%;
  min-height: 240px;
  background: #1e1e2e;
  color: #cdd6f4;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
  font-size: 13px;
  border: none;
  outline: none;
  padding: 16px;
  resize: vertical;
  line-height: 1.6;
}

.api-code {
  background: #0f172a;
  color: #38bdf8;
  padding: 16px;
  border-radius: 10px;
  font-size: 12.5px;
  font-family: 'JetBrains Mono', monospace;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
  border: 1px solid #1e293b;
}

.preview-panel {
  width: 50%;
  border-left: 1px solid #1e293b;
  display: flex;
  flex-direction: column;
  background: #0f172a;
}

.preview-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: #111827;
  border-bottom: 1px solid #1e293b;
  color: #f1f5f9;
}

.toolbar-btn {
  background: none; border: none; color: #94a3b8; font-size: 20px; cursor: pointer;
}
.toolbar-btn:hover { color: #f1f5f9; }

.pdf-frame {
  flex: 1;
  border: none;
  width: 100%;
}

.table { color: #e2e8f0; }
.table thead th { background: rgba(0,0,0,0.3); color: #94a3b8; border-bottom: 1px solid #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; padding: 10px 16px; }
.table tbody td { border-bottom: 1px solid #1e293b; padding: 12px 16px; }
code { font-size: 12px; background: #1e293b; color: #60a5fa; padding: 2px 6px; border-radius: 4px; }

.btn-success { background: #059669; border: none; padding: 10px; font-weight: 600; border-radius: 10px; }
.btn-success:hover { background: #047857; }
.btn-outline-primary { border-color: #3b82f6; color: #3b82f6; padding: 10px; font-weight: 600; border-radius: 10px; }
.btn-outline-primary:hover { background: rgba(59, 130, 246, 0.1); }

.api-card {
  transition: all 0.2s ease;
  border-color: #334155 !important;
}
.api-card:hover { border-color: #475569 !important; background: rgba(255,255,255,0.03) !important; }
.api-card.border-primary { border-color: #3b82f6 !important; background: rgba(59, 130, 246, 0.05) !important; }

.bg-light { background: #1e293b !important; border: 1px solid #334155 !important; }
.text-dark { color: #f8fafc !important; }
</style>
