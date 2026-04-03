<template>
  <div class="tv-root">
    <div class="panel-section">
      <!-- Header -->
      <div class="tv-header">
        <div class="tv-title">
          <span class="panel-section-title mb-0">Variables</span>
          <span class="tv-count">{{ localVars.length }}</span>
        </div>
        <div class="tv-header-actions">
          <button class="tv-btn-icon" @click="collapseAll = !collapseAll" :title="collapseAll ? 'Expand all' : 'Collapse all'">
            <i :class="collapseAll ? 'bi bi-chevron-expand' : 'bi bi-chevron-contract'"></i>
          </button>
          <button class="tv-btn-add" @click="addVariable">
            <i class="bi bi-plus"></i> Add
          </button>
        </div>
      </div>

      <!-- Search -->
      <div v-if="localVars.length > 3" class="tv-search">
        <i class="bi bi-search"></i>
        <input v-model="search" placeholder="ค้นหาตัวแปร..." />
        <button v-if="search" class="tv-search-clear" @click="search = ''"><i class="bi bi-x"></i></button>
      </div>

      <!-- Empty state -->
      <div v-if="!localVars.length" class="tv-empty">
        <i class="bi bi-braces"></i>
        <span>ยังไม่มีตัวแปร</span>
        <button class="tv-btn-add" @click="addVariable"><i class="bi bi-plus"></i> เพิ่มตัวแปรแรก</button>
      </div>

      <!-- Variable list -->
      <div class="tv-list" v-if="localVars.length">
        <div
          v-for="(v, i) in filteredVars"
          :key="v._idx"
          class="tv-item"
          :class="{ 'tv-item-expanded': expandedIdx === v._idx, 'tv-item-error': !v.name?.trim() }"
        >
          <!-- Compact row (always visible) -->
          <div class="tv-item-row" @click="toggleExpand(v._idx)">
            <div class="tv-item-drag" @mousedown.stop="startDrag($event, v._idx)" title="ลากเพื่อเรียงลำดับ">
              <i class="bi bi-grip-vertical"></i>
            </div>
            <div class="tv-type-badge" :class="'tv-type-' + v.type" :title="v.type">
              {{ typeLabel(v.type) }}
            </div>
            <div class="tv-item-name" :class="{ 'tv-name-empty': !v.name?.trim() }">
              {{ v.name || 'Unnamed' }}
            </div>
            <div class="tv-item-default" v-if="v.defaultValue && expandedIdx !== v._idx">
              = {{ v.defaultValue }}
            </div>
            <div class="tv-item-actions">
              <button class="tv-btn-micro" @click.stop="duplicateVar(v._idx)" title="Duplicate"><i class="bi bi-copy"></i></button>
              <button class="tv-btn-micro tv-btn-del" @click.stop="removeVar(v._idx)" title="Delete"><i class="bi bi-trash"></i></button>
              <i class="bi tv-chevron" :class="expandedIdx === v._idx ? 'bi-chevron-up' : 'bi-chevron-down'"></i>
            </div>
          </div>

          <!-- Expanded detail (toggle) -->
          <div v-if="expandedIdx === v._idx && !collapseAll" class="tv-item-detail">
            <div class="tv-field">
              <label>ชื่อตัวแปร</label>
              <input type="text" v-model="localVars[v._idx].name" placeholder="เช่น companyName" @input="emitUpdate" spellcheck="false" />
              <small class="tv-usage">ใช้ใน template: <code v-pre>{{</code>{{ v.name || '...' }}<code v-pre>}}</code></small>
            </div>
            <div class="tv-field-row">
              <div class="tv-field" style="flex:1">
                <label>ประเภท</label>
                <select v-model="localVars[v._idx].type" @change="emitUpdate">
                  <option value="string">String</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="image">Image (base64)</option>
                  <option value="array">Array (for table/list)</option>
                  <option value="object">Object</option>
                </select>
              </div>
              <div class="tv-field" style="flex:1">
                <label>ค่าเริ่มต้น</label>
                <input type="text" v-model="localVars[v._idx].defaultValue" placeholder="ไม่บังคับ" @input="emitUpdate" />
              </div>
            </div>
            <div class="tv-field">
              <label>คำอธิบาย</label>
              <input type="text" v-model="localVars[v._idx].description" placeholder="อธิบายการใช้งาน (ไม่บังคับ)" @input="emitUpdate" />
            </div>
            <!-- Array sub-fields hint -->
            <div v-if="v.type === 'array'" class="tv-hint">
              <i class="bi bi-info-circle"></i>
              <span>Array ใช้กับ Table (dataKey) หรือ Rich Text List (Dynamic)</span>
            </div>
            <div v-if="v.type === 'image'" class="tv-hint">
              <i class="bi bi-info-circle"></i>
              <span>ส่งค่าเป็น base64 string หรือ data:image/... URL</span>
            </div>
          </div>
        </div>

        <!-- No results -->
        <div v-if="filteredVars.length === 0 && search" class="tv-no-results">
          <i class="bi bi-search"></i>
          <span>ไม่พบตัวแปร "{{ search }}"</span>
        </div>
      </div>

      <!-- Summary bar -->
      <div v-if="localVars.length > 0" class="tv-summary">
        <span v-for="(count, type) in typeCounts" :key="type" class="tv-summary-chip" :class="'tv-type-' + type">
          {{ typeLabel(type) }} {{ count }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({ variables: Array })
const emit = defineEmits(['update'])

const localVars = ref(props.variables ? JSON.parse(JSON.stringify(props.variables)) : [])
const search = ref('')
const expandedIdx = ref(null)
const collapseAll = ref(false)

watch(() => props.variables, (v) => {
  if (v) localVars.value = JSON.parse(JSON.stringify(v))
}, { deep: true })

const filteredVars = computed(() => {
  const q = search.value.toLowerCase().trim()
  return localVars.value
    .map((v, i) => ({ ...v, _idx: i }))
    .filter(v => !q || v.name?.toLowerCase().includes(q) || v.type?.toLowerCase().includes(q) || v.description?.toLowerCase().includes(q))
})

const typeCounts = computed(() => {
  const counts = {}
  localVars.value.forEach(v => { counts[v.type] = (counts[v.type] || 0) + 1 })
  return counts
})

function typeLabel(t) {
  const map = { string: 'Str', number: 'Num', date: 'Date', boolean: 'Bool', image: 'Img', array: 'Arr', object: 'Obj' }
  return map[t] || t
}

function addVariable() {
  localVars.value.push({ name: '', type: 'string', defaultValue: '', description: '' })
  expandedIdx.value = localVars.value.length - 1
  collapseAll.value = false
  emitUpdate()
}

function duplicateVar(idx) {
  const src = localVars.value[idx]
  const copy = { ...JSON.parse(JSON.stringify(src)), name: src.name + '_copy' }
  localVars.value.splice(idx + 1, 0, copy)
  expandedIdx.value = idx + 1
  emitUpdate()
}

function removeVar(idx) {
  localVars.value.splice(idx, 1)
  if (expandedIdx.value === idx) expandedIdx.value = null
  emitUpdate()
}

function toggleExpand(idx) {
  if (collapseAll.value) { collapseAll.value = false }
  expandedIdx.value = expandedIdx.value === idx ? null : idx
}

function emitUpdate() {
  emit('update', JSON.parse(JSON.stringify(localVars.value)))
}

// ── Drag reorder ──────────────────────────────────────────────────────────────
function startDrag(e, idx) {
  e.preventDefault()
  const startY = e.clientY
  let currentIdx = idx
  const onMove = (me) => {
    const dy = me.clientY - startY
    const step = 44 // approximate item height
    const newIdx = Math.max(0, Math.min(localVars.value.length - 1, idx + Math.round(dy / step)))
    if (newIdx !== currentIdx) {
      const item = localVars.value.splice(currentIdx, 1)[0]
      localVars.value.splice(newIdx, 0, item)
      currentIdx = newIdx
      if (expandedIdx.value === idx) expandedIdx.value = newIdx
    }
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    document.body.style.cursor = ''
    emitUpdate()
  }
  document.body.style.cursor = 'grabbing'
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.tv-root { font-size: 12px; }

/* Header */
.tv-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.tv-title { display: flex; align-items: center; gap: 6px; }
.tv-count {
  background: var(--primary-light, #dbeafe); color: var(--primary, #1a56db);
  border-radius: 10px; padding: 0 6px; font-size: 10px; font-weight: 700;
  min-width: 18px; text-align: center;
}
.tv-header-actions { display: flex; gap: 4px; align-items: center; }
.tv-btn-icon {
  width: 26px; height: 26px; border: 1px solid var(--gray-200, #e5e7eb);
  border-radius: 5px; background: white; color: var(--gray-500, #6b7280);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; transition: all 0.12s;
}
.tv-btn-icon:hover { border-color: var(--primary, #1a56db); color: var(--primary, #1a56db); }
.tv-btn-add {
  font-size: 11px; padding: 3px 10px; border: 1px solid var(--primary, #1a56db);
  border-radius: 5px; background: white; color: var(--primary, #1a56db);
  cursor: pointer; font-weight: 600; transition: all 0.12s;
  display: flex; align-items: center; gap: 3px;
}
.tv-btn-add:hover { background: var(--primary, #1a56db); color: white; }

/* Search */
.tv-search {
  display: flex; align-items: center; gap: 6px;
  border: 1px solid var(--gray-200, #e5e7eb); border-radius: 6px;
  padding: 4px 8px; margin-bottom: 8px; background: var(--gray-50, #f9fafb);
  transition: border-color 0.15s;
}
.tv-search:focus-within { border-color: var(--primary, #1a56db); }
.tv-search i { color: var(--gray-400, #9ca3af); font-size: 11px; flex-shrink: 0; }
.tv-search input {
  flex: 1; border: none; background: transparent; outline: none;
  font-size: 11px; color: var(--gray-800, #1f2937);
}
.tv-search-clear {
  border: none; background: none; color: var(--gray-400); cursor: pointer;
  padding: 0; font-size: 14px; line-height: 1;
}

/* List */
.tv-list {
  display: flex; flex-direction: column; gap: 3px;
  max-height: 45vh; overflow-y: auto; overflow-x: hidden;
  padding-right: 2px;
}
.tv-list::-webkit-scrollbar { width: 4px; }
.tv-list::-webkit-scrollbar-track { background: transparent; }
.tv-list::-webkit-scrollbar-thumb { background: var(--gray-300, #d1d5db); border-radius: 4px; }
.tv-list::-webkit-scrollbar-thumb:hover { background: var(--gray-400, #9ca3af); }

/* Item */
.tv-item {
  border: 1px solid var(--gray-200, #e5e7eb); border-radius: 6px;
  background: white; overflow: hidden; transition: all 0.15s;
}
.tv-item:hover { border-color: var(--gray-300, #d1d5db); }
.tv-item-expanded { border-color: var(--primary, #1a56db); box-shadow: 0 0 0 2px rgba(26,86,219,0.08); }
.tv-item-error { border-color: #fca5a5; }

.tv-item-row {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px; cursor: pointer; min-height: 34px;
  transition: background 0.1s;
}
.tv-item-row:hover { background: var(--gray-50, #f9fafb); }

.tv-item-drag {
  color: var(--gray-300, #d1d5db); cursor: grab; font-size: 14px;
  flex-shrink: 0; padding: 0 2px;
  transition: color 0.1s;
}
.tv-item-drag:hover { color: var(--gray-500); }

.tv-type-badge {
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.3px; padding: 1px 5px; border-radius: 3px;
  flex-shrink: 0; min-width: 28px; text-align: center;
}
.tv-type-string  { background: #dbeafe; color: #1d4ed8; }
.tv-type-number  { background: #dcfce7; color: #16a34a; }
.tv-type-date    { background: #fef9c3; color: #b45309; }
.tv-type-boolean { background: #f3e8ff; color: #7c3aed; }
.tv-type-image   { background: #fce7f3; color: #db2777; }
.tv-type-array   { background: #ffedd5; color: #ea580c; }
.tv-type-object  { background: #e0e7ff; color: #4338ca; }

.tv-item-name {
  flex: 1; font-weight: 600; color: var(--gray-800, #1f2937);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.tv-name-empty { color: var(--gray-400); font-style: italic; }

.tv-item-default {
  font-size: 10px; color: var(--gray-400); max-width: 80px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  font-family: monospace;
}

.tv-item-actions { display: flex; align-items: center; gap: 2px; flex-shrink: 0; }
.tv-btn-micro {
  width: 22px; height: 22px; border: none; border-radius: 4px;
  background: transparent; color: var(--gray-400); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; transition: all 0.1s;
}
.tv-btn-micro:hover { background: var(--gray-100, #f3f4f6); color: var(--gray-600); }
.tv-btn-del:hover { background: #fee2e2; color: #dc2626; }
.tv-chevron { font-size: 10px; color: var(--gray-400); transition: transform 0.15s; }

/* Detail panel */
.tv-item-detail {
  padding: 8px 10px 10px; border-top: 1px solid var(--gray-100, #f3f4f6);
  background: var(--gray-50, #f9fafb);
  display: flex; flex-direction: column; gap: 6px;
}
.tv-field { display: flex; flex-direction: column; gap: 2px; }
.tv-field label {
  font-size: 10px; font-weight: 600; color: var(--gray-500, #6b7280);
  text-transform: uppercase; letter-spacing: 0.3px;
}
.tv-field input, .tv-field select {
  border: 1px solid var(--gray-200, #e5e7eb); border-radius: 5px;
  padding: 4px 8px; font-size: 11.5px; outline: none;
  transition: border-color 0.15s; background: white;
}
.tv-field input:focus, .tv-field select:focus {
  border-color: var(--primary, #1a56db);
  box-shadow: 0 0 0 2px rgba(26,86,219,0.08);
}
.tv-field-row { display: flex; gap: 6px; }

.tv-usage {
  font-size: 10px; color: var(--gray-400);
}
.tv-usage code {
  font-size: 10px; background: var(--gray-100, #f3f4f6);
  padding: 0 2px; border-radius: 2px;
}

.tv-hint {
  display: flex; align-items: flex-start; gap: 5px;
  font-size: 10px; color: var(--primary, #1a56db);
  background: #eff6ff; border: 1px solid #bfdbfe;
  border-radius: 5px; padding: 5px 8px;
}

/* Empty & no results */
.tv-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 20px 10px; color: var(--gray-400);
}
.tv-empty i { font-size: 24px; }
.tv-no-results {
  display: flex; align-items: center; gap: 6px; justify-content: center;
  padding: 14px; color: var(--gray-400); font-size: 11px;
}

/* Summary */
.tv-summary {
  display: flex; gap: 4px; flex-wrap: wrap; margin-top: 8px;
  padding-top: 8px; border-top: 1px solid var(--gray-100, #f3f4f6);
}
.tv-summary-chip {
  font-size: 9px; font-weight: 600; padding: 1px 6px;
  border-radius: 3px;
}
</style>
