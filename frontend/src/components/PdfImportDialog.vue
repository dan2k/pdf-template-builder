<!-- PDF Import Dialog — drag & drop a PDF to convert it to a template -->
<template>
  <teleport to="body">
    <div class="pid-backdrop" @click.self="$emit('close')">
      <div class="pid-dialog">
        <!-- Header -->
        <div class="pid-header">
          <div class="d-flex align-items-center gap-2">
            <div class="pid-icon"><i class="bi bi-file-earmark-arrow-up"></i></div>
            <div>
              <div class="pid-title">Import PDF as Template</div>
              <div class="pid-sub">แปลง PDF เป็น template ที่แก้ไขได้</div>
            </div>
          </div>
          <button class="pid-close" @click="$emit('close')"><i class="bi bi-x-lg"></i></button>
        </div>

        <!-- Drop zone -->
        <div v-if="!result" class="pid-body">
          <div
            class="pid-dropzone"
            :class="{ dragging: isDragging, hasFile: selectedFile }"
            @dragover.prevent="isDragging = true"
            @dragleave="isDragging = false"
            @drop.prevent="onDrop"
            @click="fileInput.click()"
          >
            <input ref="fileInput" type="file" accept=".pdf,application/pdf" hidden @change="onFileChange" />
            <template v-if="!selectedFile">
              <div class="drop-icon"><i class="bi bi-cloud-upload"></i></div>
              <div class="drop-title">ลาก PDF มาวางที่นี่</div>
              <div class="drop-sub">หรือคลิกเพื่อเลือกไฟล์ · รองรับ .pdf ขนาดสูงสุด 50MB</div>
            </template>
            <template v-else>
              <div class="drop-icon text-success"><i class="bi bi-file-earmark-pdf-fill"></i></div>
              <div class="drop-title">{{ selectedFile.name }}</div>
              <div class="drop-sub">{{ formatSize(selectedFile.size) }} · คลิกเพื่อเปลี่ยนไฟล์</div>
            </template>
          </div>

          <!-- Options -->
          <div v-if="selectedFile" class="pid-opts">
            <div class="pid-opts-title">ตัวเลือกการนำเข้า</div>
            <div class="pid-opt-row">
              <label class="pid-opt-label">ชื่อ Template</label>
              <input type="text" class="form-control form-control-sm" v-model="templateName" placeholder="ชื่อ template ที่จะสร้าง" />
            </div>
            <div class="pid-opt-row">
              <label class="pid-opt-label">นำเข้า</label>
              <select class="form-select form-select-sm" v-model="importMode">
                <option value="text">ข้อความทั้งหมด (แปลงเป็น Text elements)</option>
                <option value="pages">แต่ละหน้าเป็น Template Page</option>
              </select>
            </div>
          </div>

          <!-- Error -->
          <div v-if="error" class="pid-error">
            <i class="bi bi-exclamation-triangle me-2"></i>{{ error }}
          </div>
        </div>

        <!-- Preview result -->
        <div v-else class="pid-body pid-result">
          <div class="pid-result-header">
            <i class="bi bi-check-circle-fill text-success me-2"></i>
            <span>แปลงสำเร็จ! ได้ <strong>{{ result.pages.length }}</strong> หน้า, <strong>{{ totalElements }}</strong> elements</span>
          </div>
          <div class="pid-meta" v-if="result.importMeta?.pdfInfo?.title || result.importMeta?.pdfInfo?.author">
            <span v-if="result.importMeta.pdfInfo.title"><i class="bi bi-card-text me-1"></i>{{ result.importMeta.pdfInfo.title }}</span>
            <span v-if="result.importMeta.pdfInfo.author"><i class="bi bi-person me-1"></i>{{ result.importMeta.pdfInfo.author }}</span>
          </div>
          <div class="pid-pages-preview">
            <div v-for="(page, i) in result.pages.slice(0, 5)" :key="i" class="pid-page-thumb">
              <div class="pid-page-mini">
                <div v-for="el in page.elements.slice(0, 8)" :key="el.id" class="pid-el-line"
                  :style="{ top: (el.y/841.89*100)+'%', left: (el.x/595.28*100)+'%', width: (el.width/595.28*100)+'%', fontSize: '5px', fontWeight: el.fontWeight }">
                  {{ el.content?.slice(0, 20) }}
                </div>
              </div>
              <div class="pid-page-label">หน้า {{ i+1 }}</div>
            </div>
            <div v-if="result.pages.length > 5" class="pid-more-pages">+{{ result.pages.length - 5 }} หน้า</div>
          </div>
          <div class="pid-opt-row mt-2">
            <label class="pid-opt-label">ชื่อ Template</label>
            <input type="text" class="form-control form-control-sm" v-model="result.name" />
          </div>
        </div>

        <!-- Footer -->
        <div class="pid-footer">
          <button class="btn btn-secondary btn-sm" @click="reset" v-if="result">
            <i class="bi bi-arrow-left me-1"></i>เลือกใหม่
          </button>
          <button class="btn btn-secondary btn-sm" @click="$emit('close')" v-else>ยกเลิก</button>
          <div class="d-flex gap-2">
            <button v-if="selectedFile && !result"
              class="btn btn-primary btn-sm"
              :disabled="importing"
              @click="doImport">
              <span v-if="importing"><span class="spinner-border spinner-border-sm me-1"></span>กำลังแปลง...</span>
              <span v-else><i class="bi bi-magic me-1"></i>แปลง PDF</span>
            </button>
            <button v-if="result"
              class="btn btn-success btn-sm"
              :disabled="saving"
              @click="doSave">
              <span v-if="saving"><span class="spinner-border spinner-border-sm me-1"></span>กำลังบันทึก...</span>
              <span v-else><i class="bi bi-floppy me-1"></i>บันทึกเป็น Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { ref, computed } from 'vue'
import { importApi, templatesApi } from '../api'

const emit = defineEmits(['close', 'imported'])

const fileInput     = ref(null)
const selectedFile  = ref(null)
const isDragging    = ref(false)
const importing     = ref(false)
const saving        = ref(false)
const error         = ref('')
const result        = ref(null)
const templateName  = ref('')
const importMode    = ref('pages')

const totalElements = computed(() =>
  (result.value?.pages || []).reduce((s, p) => s + (p.elements?.length || 0), 0)
)

function onDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
    setFile(file)
  } else {
    error.value = 'กรุณาเลือกไฟล์ .pdf เท่านั้น'
  }
}

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) setFile(file)
}

function setFile(file) {
  selectedFile.value = file
  templateName.value = file.name.replace(/\.pdf$/i, '')
  error.value = ''
  result.value = null
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / 1024 / 1024).toFixed(1) + ' MB'
}

async function doImport() {
  if (!selectedFile.value) return
  importing.value = true
  error.value = ''
  try {
    const res = await importApi.importPdf(selectedFile.value)
    result.value = res.data
    if (templateName.value) result.value.name = templateName.value
  } catch (e) {
    error.value = e.response?.data?.message || e.message || 'เกิดข้อผิดพลาดในการแปลง PDF'
  } finally {
    importing.value = false
  }
}

async function doSave() {
  if (!result.value) return
  saving.value = true
  try {
    const res = await templatesApi.create({
      name:        result.value.name,
      description: result.value.description,
      pages:       result.value.pages,
      variables:   result.value.variables || [],
    })
    emit('imported', res.data)
    emit('close')
  } catch (e) {
    error.value = e.response?.data?.message || 'บันทึกไม่สำเร็จ'
  } finally {
    saving.value = false
  }
}

function reset() {
  result.value = null
  selectedFile.value = null
  error.value = ''
}
</script>

<style scoped>
.pid-backdrop {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,.55); backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
}
.pid-dialog {
  background: white; border-radius: 16px; width: 560px; max-width: 96vw;
  box-shadow: 0 24px 80px rgba(0,0,0,.25);
  display: flex; flex-direction: column; overflow: hidden;
}
.pid-header {
  padding: 18px 20px; border-bottom: 1px solid #f1f5f9;
  display: flex; align-items: center; justify-content: space-between;
}
.pid-icon { width: 40px; height: 40px; border-radius: 10px; background: #eff6ff; color: #1a56db; font-size: 20px; display: flex; align-items: center; justify-content: center; }
.pid-title { font-weight: 700; font-size: 15px; color: #1e293b; }
.pid-sub { font-size: 11px; color: #64748b; }
.pid-close { border: none; background: transparent; font-size: 16px; color: #94a3b8; cursor: pointer; padding: 4px; border-radius: 6px; }
.pid-close:hover { background: #f1f5f9; color: #374151; }

.pid-body { padding: 20px; flex: 1; overflow-y: auto; }

.pid-dropzone {
  border: 2px dashed #cbd5e1; border-radius: 12px;
  background: #f8fafc; padding: 32px 20px; text-align: center;
  cursor: pointer; transition: all .2s;
}
.pid-dropzone:hover, .pid-dropzone.dragging { border-color: #1a56db; background: #eff6ff; }
.pid-dropzone.hasFile { border-color: #10b981; background: #f0fdf4; border-style: solid; }
.drop-icon { font-size: 40px; color: #94a3b8; margin-bottom: 12px; }
.pid-dropzone.hasFile .drop-icon { color: #10b981; }
.drop-title { font-weight: 600; font-size: 15px; color: #374151; margin-bottom: 4px; }
.drop-sub { font-size: 12px; color: #64748b; }

.pid-opts { margin-top: 16px; }
.pid-opts-title { font-size: 12px; font-weight: 600; color: #374151; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .5px; }
.pid-opt-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.pid-opt-label { font-size: 12px; color: #64748b; width: 90px; flex-shrink: 0; }

.pid-error { margin-top: 12px; padding: 10px 14px; background: #fef2f2; border-radius: 8px; color: #b91c1c; font-size: 12px; }

/* Result */
.pid-result-header { display: flex; align-items: center; font-size: 13px; color: #374151; margin-bottom: 12px; font-weight: 500; }
.pid-meta { display: flex; gap: 16px; font-size: 11px; color: #64748b; margin-bottom: 14px; }
.pid-pages-preview { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.pid-page-thumb { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.pid-page-mini { width: 70px; height: 99px; background: white; border: 1px solid #e2e8f0; border-radius: 4px; position: relative; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.08); }
.pid-el-line { position: absolute; height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden; white-space: nowrap; font-size: 3px; color: #64748b; line-height: 4px; }
.pid-page-label { font-size: 10px; color: #64748b; }
.pid-more-pages { display: flex; align-items: center; font-size: 12px; color: #94a3b8; padding: 8px; }

.pid-footer {
  padding: 14px 20px; border-top: 1px solid #f1f5f9;
  display: flex; align-items: center; justify-content: space-between;
}
</style>
