<template>
  <div class="generate-layout">
    <header class="app-header">
      <div class="d-flex align-items-center gap-3">
        <router-link :to="canEdit ? `/editor/${templateId}` : '/'" class="btn btn-sm btn-outline-secondary">
          <i class="bi bi-arrow-left me-1"></i>{{ canEdit ? 'Back to Editor' : 'Back to Dashboard' }}
        </router-link>
        <div class="logo">
          <i class="bi bi-file-earmark-arrow-down-fill text-success"></i>
          <span>Generate PDF</span>
        </div>
      </div>
      <router-link to="/" class="btn btn-sm btn-ghost">
        <i class="bi bi-house me-1"></i>Home
      </router-link>
    </header>

    <div class="generate-body">
      <div class="generate-main">
        <!-- Template info -->
        <div class="card mb-4 border-0 shadow-sm" v-if="template">
          <div class="card-body">
            <div class="d-flex align-items-center gap-3">
              <div class="template-icon">
                <i class="bi bi-file-earmark-pdf-fill"></i>
              </div>
              <div>
                <h5 class="mb-1">{{ template.name }}</h5>
                <div class="text-muted small">{{ template.pages?.length || 0 }} page(s) &bull; {{ (template.variables || []).length }} variable(s)</div>
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
                  <div class="p-2 border rounded-3 bg-light h-100">
                    <div class="fw-bold small mb-1 text-dark"><i class="bi bi-key-fill me-1 text-warning"></i> Authentication</div>
                    <div class="small text-muted">ต้องส่ง Header <code>X-API-Key</code> ทุกครั้ง (สร้างได้ในหน้า Template Settings)</div>
                  </div>
                </div>
                <div class="col-sm-6">
                  <div class="p-2 border rounded-3 bg-light h-100" @click="apiMode = apiMode === 'file' ? 'base64' : 'file'" style="cursor: pointer;">
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
</script>

<style scoped>
.generate-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.app-header {
  height: var(--header-height);
  background: white;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
}

.logo {
  display: flex; align-items: center; gap: 8px;
  font-size: 16px; font-weight: 700;
}
.logo i { font-size: 20px; }

.btn-ghost {
  background: transparent; border: none;
  color: var(--gray-600); padding: 4px 8px; border-radius: 6px;
}
.btn-ghost:hover { background: var(--gray-100); }

.generate-body {
  flex: 1;
  overflow: hidden;
  display: flex;
  gap: 0;
}

.generate-main {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  max-width: 700px;
}

.template-icon {
  width: 48px; height: 48px;
  background: #fee2e2;
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  color: #dc2626;
  font-size: 22px;
}

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
  background: var(--gray-900);
  color: #a5f3fc;
  padding: 14px;
  border-radius: 8px;
  font-size: 12px;
  font-family: monospace;
  overflow-x: auto;
  white-space: pre;
  margin: 0;
}

.preview-panel {
  width: 50%;
  border-left: 1px solid var(--gray-200);
  display: flex;
  flex-direction: column;
  background: var(--gray-50);
}

.preview-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
}

.pdf-frame {
  flex: 1;
  border: none;
  width: 100%;
}

code { font-size: 12px; background: var(--gray-100); padding: 2px 6px; border-radius: 4px; }
</style>
