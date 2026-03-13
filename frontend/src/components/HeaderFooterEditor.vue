<template>
  <div class="hfe">

    <!-- Tabs -->
    <div class="hfe-tabs">
      <button class="hfe-tab" :class="{ active: tab==='header' }" @click="tab='header'">
        <i class="bi bi-layout-text-window-reverse"></i> Header
      </button>
      <button class="hfe-tab" :class="{ active: tab==='footer' }" @click="tab='footer'">
        <i class="bi bi-layout-text-sidebar-reverse"></i> Footer
      </button>
      <button class="hfe-tab" :class="{ active: tab==='pagenum' }" @click="tab='pagenum'">
        <i class="bi bi-hash"></i> Page No.
      </button>
    </div>

    <!-- Apply to all pages -->
    <div class="apply-all-row">
      <div class="apply-all-info">
        <i class="bi bi-layers me-2 text-primary"></i>
        <div>
          <div class="apply-all-title">ใช้กับทุกหน้า</div>
          <div class="apply-all-sub">เปิด = กำหนดครั้งเดียวใช้ได้กับทุก page</div>
        </div>
      </div>
      <label class="toggle-switch">
        <input type="checkbox" :checked="applyToAll" @change="toggleApplyAll($event.target.checked)" />
        <span class="toggle-track"></span>
      </label>
    </div>
    <div v-if="applyToAll" class="global-active-banner">
      <i class="bi bi-globe me-2"></i>
      <div>
        <div class="gab-title">Global — ใช้กับทุกหน้า</div>
        <div class="gab-sub">แก้ไขที่นี่จะมีผลกับทุก page อัตโนมัติ</div>
      </div>
    </div>

    <!-- ════════════ HEADER ════════════ -->
    <template v-if="tab==='header'">
      <div class="zone-toggle">
        <span class="zone-title"><i class="bi bi-layout-text-window-reverse me-2 text-primary"></i>Header</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="cfg.header.enabled" @change="setZone('header','enabled',$event.target.checked)" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <template v-if="cfg.header.enabled">
        <!-- Layout settings -->
        <div class="panel-section">
          <div class="panel-section-title">Layout</div>
          <div class="prop-row">
            <label class="prop-label">ความสูง (pt)</label>
            <div class="size-spin" style="max-width:110px">
              <button @click="setZone('header','height',Math.max(20,(cfg.header.height||60)-5))">−</button>
              <input type="number" :value="cfg.header.height||60" @change="setZone('header','height',+$event.target.value)" min="20" max="200" />
              <button @click="setZone('header','height',Math.min(200,(cfg.header.height||60)+5))">+</button>
            </div>
          </div>
          <div class="prop-row">
            <label class="prop-label">Background</label>
            <div class="d-flex gap-2 align-items-center">
              <input type="color" class="color-swatch"
                :value="cfg.header.backgroundColor && cfg.header.backgroundColor!=='transparent' ? cfg.header.backgroundColor : '#ffffff'"
                @input="setZone('header','backgroundColor',$event.target.value)" />
              <button class="btn btn-xs btn-outline-secondary" @click="setZone('header','backgroundColor','transparent')">None</button>
            </div>
          </div>
        </div>

        <!-- Visual canvas for header -->
        <div class="panel-section">
          <div class="panel-section-title d-flex justify-content-between align-items-center">
            <span>Canvas Preview</span>
            <div class="d-flex gap-1">
              <button class="add-btn" title="Text"  @click="addEl('header','text')"><i class="bi bi-fonts"></i></button>
              <button class="add-btn" title="Image" @click="addEl('header','image')"><i class="bi bi-image"></i></button>
              <button class="add-btn" title="Shape" @click="addEl('header','shape')"><i class="bi bi-square"></i></button>
              <button class="add-btn" title="Line"  @click="addEl('header','line')"><i class="bi bi-dash-lg"></i></button>
            </div>
          </div>
          <HFCanvas
            zone="header"
            :config="cfg.header"
            :selected-id="selZone==='header' ? selId : null"
            @select="selectById('header',$event)"
            @update-el="patchEl('header',$event.id,$event.patch)"
          />
        </div>

        <!-- Element list -->
        <div class="panel-section" v-if="cfg.header.elements?.length">
          <div class="panel-section-title">Elements</div>
          <div v-for="el in cfg.header.elements" :key="el.id"
            class="el-row" :class="{ active: selId===el.id && selZone==='header' }"
            @click="select('header', el)">
            <div class="el-icon" :class="'t-'+el.type"><i :class="iconOf(el)"></i></div>
            <span class="el-name">{{ labelOf(el) }}</span>
            <button class="el-del" @click.stop="removeEl('header',el.id)"><i class="bi bi-x"></i></button>
          </div>
        </div>

        <!-- Selected element props — stays open, no auto-hide -->
        <div v-if="selEl && selZone==='header'" class="panel-section el-props-panel">
          <div class="panel-section-title">
            <i :class="iconOf(selEl)" class="me-1"></i>{{ labelOf(selEl) }}
            <button class="btn-close-sm ms-auto" @click="selEl=null;selId=null"><i class="bi bi-x"></i></button>
          </div>
          <MiniElProps :element="selEl" @update="patchEl('header', selEl.id, $event)" />
        </div>
      </template>
    </template>

    <!-- ════════════ FOOTER ════════════ -->
    <template v-if="tab==='footer'">
      <div class="zone-toggle">
        <span class="zone-title"><i class="bi bi-layout-text-sidebar-reverse me-2 text-primary"></i>Footer</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="cfg.footer.enabled" @change="setZone('footer','enabled',$event.target.checked)" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <template v-if="cfg.footer.enabled">
        <div class="panel-section">
          <div class="panel-section-title">Layout</div>
          <div class="prop-row">
            <label class="prop-label">ความสูง (pt)</label>
            <div class="size-spin" style="max-width:110px">
              <button @click="setZone('footer','height',Math.max(20,(cfg.footer.height||40)-5))">−</button>
              <input type="number" :value="cfg.footer.height||40" @change="setZone('footer','height',+$event.target.value)" min="20" max="200" />
              <button @click="setZone('footer','height',Math.min(200,(cfg.footer.height||40)+5))">+</button>
            </div>
          </div>
          <div class="prop-row">
            <label class="prop-label">Background</label>
            <div class="d-flex gap-2 align-items-center">
              <input type="color" class="color-swatch"
                :value="cfg.footer.backgroundColor && cfg.footer.backgroundColor!=='transparent' ? cfg.footer.backgroundColor : '#ffffff'"
                @input="setZone('footer','backgroundColor',$event.target.value)" />
              <button class="btn btn-xs btn-outline-secondary" @click="setZone('footer','backgroundColor','transparent')">None</button>
            </div>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-section-title d-flex justify-content-between align-items-center">
            <span>Canvas Preview</span>
            <div class="d-flex gap-1">
              <button class="add-btn" title="Text"  @click="addEl('footer','text')"><i class="bi bi-fonts"></i></button>
              <button class="add-btn" title="Image" @click="addEl('footer','image')"><i class="bi bi-image"></i></button>
              <button class="add-btn" title="Shape" @click="addEl('footer','shape')"><i class="bi bi-square"></i></button>
              <button class="add-btn" title="Line"  @click="addEl('footer','line')"><i class="bi bi-dash-lg"></i></button>
            </div>
          </div>
          <HFCanvas
            zone="footer"
            :config="cfg.footer"
            :selected-id="selZone==='footer' ? selId : null"
            @select="selectById('footer',$event)"
            @update-el="patchEl('footer',$event.id,$event.patch)"
          />
        </div>

        <div class="panel-section" v-if="cfg.footer.elements?.length">
          <div class="panel-section-title">Elements</div>
          <div v-for="el in cfg.footer.elements" :key="el.id"
            class="el-row" :class="{ active: selId===el.id && selZone==='footer' }"
            @click="select('footer', el)">
            <div class="el-icon" :class="'t-'+el.type"><i :class="iconOf(el)"></i></div>
            <span class="el-name">{{ labelOf(el) }}</span>
            <button class="el-del" @click.stop="removeEl('footer',el.id)"><i class="bi bi-x"></i></button>
          </div>
        </div>

        <div v-if="selEl && selZone==='footer'" class="panel-section el-props-panel">
          <div class="panel-section-title">
            <i :class="iconOf(selEl)" class="me-1"></i>{{ labelOf(selEl) }}
            <button class="btn-close-sm ms-auto" @click="selEl=null;selId=null"><i class="bi bi-x"></i></button>
          </div>
          <MiniElProps :element="selEl" @update="patchEl('footer', selEl.id, $event)" />
        </div>
      </template>
    </template>

    <!-- ════════════ PAGE NUMBER ════════════ -->
    <template v-if="tab==='pagenum'">
      <div class="zone-toggle">
        <span class="zone-title"><i class="bi bi-hash me-2 text-primary"></i>เลขหน้า</span>
        <label class="toggle-switch">
          <input type="checkbox" :checked="cfg.pageNumber.enabled" @change="setPn('enabled',$event.target.checked)" />
          <span class="toggle-track"></span>
        </label>
      </div>

      <template v-if="cfg.pageNumber.enabled">
        <div class="pn-preview-bar">
          <div class="pn-preview-page">
            <div class="pn-dot" :class="'pn-pos-'+cfg.pageNumber.position"
              :style="{ fontSize:(cfg.pageNumber.fontSize||10)+'px', color: cfg.pageNumber.color||'#666' }">
              {{ previewText }}
            </div>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-section-title">รูปแบบ</div>
          <div class="preset-grid mb-2">
            <button v-for="p in formatPresets" :key="p.v"
              class="preset-chip" :class="{ active: cfg.pageNumber.format===p.v }"
              @click="setPn('format',p.v)">{{ p.l }}</button>
          </div>
          <input type="text" class="form-control form-control-sm"
            :value="cfg.pageNumber.format" @change="setPn('format',$event.target.value)"
            placeholder="{page} / {total}" />
          <div class="mt-1" style="font-size:10px;color:var(--gray-400)">
            <code>{page}</code> = หน้าปัจจุบัน &nbsp; <code>{total}</code> = ทั้งหมด
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-section-title">ตำแหน่ง</div>
          <div class="pos-grid">
            <button v-for="p in posOptions" :key="p.v"
              class="pos-btn" :class="{ active: cfg.pageNumber.position===p.v }"
              :title="p.l" @click="setPn('position',p.v)">
              <i :class="p.icon"></i>
              <span>{{ p.l }}</span>
            </button>
          </div>
        </div>

        <div class="panel-section">
          <div class="panel-section-title">สไตล์</div>
          <div class="prop-row">
            <label class="prop-label">ขนาด Font</label>
            <div class="size-spin" style="max-width:110px">
              <button @click="setPn('fontSize',Math.max(6,(cfg.pageNumber.fontSize||10)-1))">−</button>
              <input type="number" :value="cfg.pageNumber.fontSize||10" @change="setPn('fontSize',+$event.target.value)" min="6" max="28" />
              <button @click="setPn('fontSize',Math.min(28,(cfg.pageNumber.fontSize||10)+1))">+</button>
            </div>
          </div>
          <div class="prop-row">
            <label class="prop-label">สี</label>
            <div class="d-flex gap-2 align-items-center">
              <input type="color" class="color-swatch" :value="cfg.pageNumber.color||'#666666'" @input="setPn('color',$event.target.value)" />
              <input type="text" class="form-control form-control-sm" style="width:72px;font-size:11px;font-family:monospace"
                :value="cfg.pageNumber.color||'#666666'" @change="setPn('color',$event.target.value)" />
            </div>
          </div>
          <div class="prop-row">
            <label class="prop-label">Font</label>
            <select class="form-select form-select-sm prop-control"
              :value="cfg.pageNumber.fontFamily||'Helvetica'" @change="setPn('fontFamily',$event.target.value)">
              <option value="Helvetica">Helvetica</option>
              <option value="Sarabun">Sarabun</option>
              <option value="Kanit">Kanit</option>
              <option value="Prompt">Prompt</option>
              <option value="Mitr">Mitr</option>
              <option value="NotoSansThai">Noto Sans Thai</option>
              <option value="Roboto">Roboto</option>
              <option value="Lato">Lato</option>
            </select>
          </div>
          <div class="prop-row">
            <label class="prop-label">ระยะขอบ (pt)</label>
            <input type="number" class="form-control form-control-sm prop-control"
              :value="cfg.pageNumber.margin??15" @change="setPn('margin',+$event.target.value)" min="0" max="60" />
          </div>
        </div>
      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import MiniElProps from './MiniElProps.vue'
import HFCanvas from './HFCanvas.vue'

const props = defineProps({
  page:      Object,
  globalHF:  Object,
  pageIndex: { type: Number, default: 0 },
})
const emit = defineEmits(['update', 'update-global'])

const tab     = ref('header')
const selId   = ref(null)
const selZone = ref('')
const selEl   = ref(null)

function defaultHeader()     { return { enabled: false, height: 60,  backgroundColor: 'transparent', elements: [] } }
function defaultFooter()     { return { enabled: false, height: 40,  backgroundColor: 'transparent', elements: [] } }
function defaultPageNumber() { return { enabled: false, position: 'bottom-center', format: 'หน้า {page} / {total}', fontSize: 10, fontFamily: 'Helvetica', color: '#666666', margin: 15 } }

function getInitSrc() {
  if (props.globalHF?.applyToAllPages) return props.globalHF
  return props.page || {}
}

const cfg = reactive({
  header:     { ...defaultHeader(),     ...(getInitSrc().header     || {}) },
  footer:     { ...defaultFooter(),     ...(getInitSrc().footer     || {}) },
  pageNumber: { ...defaultPageNumber(), ...(getInitSrc().pageNumber || {}) },
})

function syncCfg() {
  const src = applyToAll.value ? (props.globalHF || props.page || {}) : (props.page || {})
  Object.assign(cfg.header,     { ...defaultHeader(),     ...(src.header     || {}) })
  Object.assign(cfg.footer,     { ...defaultFooter(),     ...(src.footer     || {}) })
  Object.assign(cfg.pageNumber, { ...defaultPageNumber(), ...(src.pageNumber || {}) })
  // keep selected el reference alive after sync
  if (selId.value && selZone.value) {
    const found = cfg[selZone.value]?.elements?.find(e => e.id === selId.value)
    selEl.value = found || null
    if (!found) { selId.value = null; selZone.value = '' }
  }
}

watch(() => props.page,                    () => syncCfg(), { immediate: false })
watch(() => props.globalHF,                () => syncCfg(), { deep: true, immediate: false })
watch(() => props.globalHF?.applyToAllPages, () => syncCfg(), { immediate: false })

function emit_update() {
  const payload = {
    header:     { ...cfg.header,     elements: JSON.parse(JSON.stringify(cfg.header.elements||[])) },
    footer:     { ...cfg.footer,     elements: JSON.parse(JSON.stringify(cfg.footer.elements||[])) },
    pageNumber: { ...cfg.pageNumber },
  }
  if (applyToAll.value) {
    emit('update-global', { ...payload, applyToAllPages: true })
  } else {
    emit('update', payload)
  }
}

function setZone(zone, key, val) {
  cfg[zone][key] = val
  // do NOT reset selEl here — that caused the auto-hide bug
  emit_update()
}

function setPn(key, val) {
  cfg.pageNumber[key] = val
  emit_update()
}

// ── Elements ──────────────────────────────────────────────────────────────────
function genId() { return 'hf_' + Math.random().toString(36).slice(2, 9) }

function addEl(zone, type) {
  const zConf = cfg[zone]
  const h = zConf.height || 60
  const base = { id: genId(), type, x: 10, y: 5, width: 180, height: Math.min(28, h - 10), zIndex: (zConf.elements?.length || 0) }
  let el
  if (type === 'text')  el = { ...base, content: zone === 'header' ? 'Header Text' : 'Footer Text', fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'normal', fontStyle: 'normal', color: '#333333', align: 'left' }
  if (type === 'image') el = { ...base, src: '', objectFit: 'contain' }
  if (type === 'shape') el = { ...base, type: 'shape', shape: 'rectangle', fillColor: '#e5e7eb', strokeColor: '#9ca3af', strokeWidth: 1 }
  if (type === 'line')  el = { ...base, type: 'shape', shape: 'line', width: 500, height: 2, strokeColor: '#cccccc', strokeWidth: 1, fillColor: 'transparent' }
  if (!zConf.elements) zConf.elements = []
  zConf.elements.push(el)
  select(zone, el)
  emit_update()
}

function removeEl(zone, id) {
  cfg[zone].elements = cfg[zone].elements.filter(e => e.id !== id)
  if (selId.value === id) { selEl.value = null; selId.value = null; selZone.value = '' }
  emit_update()
}

function patchEl(zone, id, patch) {
  const el = cfg[zone].elements.find(e => e.id === id)
  if (el) {
    Object.assign(el, patch)
    // keep selEl reactive — re-point to same object
    if (selEl.value?.id === id) Object.assign(selEl.value, patch)
  }
  emit_update()
}

function select(zone, el) {
  selZone.value = zone
  selId.value   = el.id
  selEl.value   = el
}

function selectById(zone, id) {
  const el = cfg[zone]?.elements?.find(e => e.id === id)
  if (el) select(zone, el)
  else { selEl.value = null; selId.value = null; selZone.value = '' }
}

function iconOf(el) {
  if (el.type === 'text')  return 'bi bi-fonts'
  if (el.type === 'image') return 'bi bi-image'
  if (el.type === 'shape') return el.shape === 'line' ? 'bi bi-dash-lg' : 'bi bi-square'
  return 'bi bi-square'
}
function labelOf(el) {
  if (el.type === 'text')  return el.content?.slice(0, 22) || '(text)'
  if (el.type === 'image') return 'Image'
  if (el.type === 'shape') return el.shape === 'line' ? 'Line' : 'Shape'
  return el.type
}

// ── Page number ───────────────────────────────────────────────────────────────
const formatPresets = [
  { l: '{page}',                 v: '{page}' },
  { l: '{page} / {total}',       v: '{page} / {total}' },
  { l: 'Page {page}',            v: 'Page {page}' },
  { l: 'Page {page} of {total}', v: 'Page {page} of {total}' },
  { l: 'หน้า {page}',            v: 'หน้า {page}' },
  { l: 'หน้า {page}/{total}',    v: 'หน้า {page}/{total}' },
]
const posOptions = [
  { v: 'top-left',      l: 'บนซ้าย',   icon: 'bi bi-box-arrow-in-up-left' },
  { v: 'top-center',    l: 'บนกลาง',   icon: 'bi bi-box-arrow-in-up' },
  { v: 'top-right',     l: 'บนขวา',    icon: 'bi bi-box-arrow-in-up-right' },
  { v: 'bottom-left',   l: 'ล่างซ้าย', icon: 'bi bi-box-arrow-in-down-left' },
  { v: 'bottom-center', l: 'ล่างกลาง', icon: 'bi bi-box-arrow-in-down' },
  { v: 'bottom-right',  l: 'ล่างขวา',  icon: 'bi bi-box-arrow-in-down-right' },
]
const previewText = computed(() =>
  (cfg.pageNumber.format || '{page}').replace('{page}', '3').replace('{total}', '10')
)

// ── Apply to all ──────────────────────────────────────────────────────────────
const applyToAll = computed(() => props.globalHF?.applyToAllPages === true)

function toggleApplyAll(val) {
  if (val) {
    emit('update-global', {
      applyToAllPages: true,
      header:     { ...cfg.header,     elements: JSON.parse(JSON.stringify(cfg.header.elements||[])) },
      footer:     { ...cfg.footer,     elements: JSON.parse(JSON.stringify(cfg.footer.elements||[])) },
      pageNumber: { ...cfg.pageNumber },
    })
  } else {
    emit('update-global', { applyToAllPages: false })
    const p = props.page || {}
    Object.assign(cfg.header,     { ...defaultHeader(),     ...(p.header     || {}) })
    Object.assign(cfg.footer,     { ...defaultFooter(),     ...(p.footer     || {}) })
    Object.assign(cfg.pageNumber, { ...defaultPageNumber(), ...(p.pageNumber || {}) })
  }
}
</script>

<style scoped>
.hfe { display: flex; flex-direction: column; min-height: 0; }

.hfe-tabs {
  display: flex; border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50); flex-shrink: 0; position: sticky; top: 0; z-index: 5;
}
.hfe-tab {
  flex: 1; padding: 8px 2px; border: none; background: transparent;
  font-size: 11px; font-weight: 500; color: var(--gray-500); cursor: pointer;
  border-bottom: 2px solid transparent; transition: all .15s;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.hfe-tab:hover  { background: var(--gray-100); color: var(--gray-700); }
.hfe-tab.active { color: var(--primary); border-bottom-color: var(--primary); background: white; font-weight: 600; }

.apply-all-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; background: #eff6ff; border-bottom: 1px solid #bfdbfe;
}
.apply-all-info  { display: flex; align-items: center; gap: 8px; }
.apply-all-title { font-size: 12px; font-weight: 600; color: #1e40af; }
.apply-all-sub   { font-size: 10px; color: #3b82f6; margin-top: 1px; }

.global-active-banner {
  background: #f0fdf4; border-bottom: 1px solid #bbf7d0;
  padding: 8px 14px; font-size: 11px; color: #15803d;
  display: flex; align-items: center; gap: 8px;
}
.gab-title { font-weight: 600; font-size: 12px; }
.gab-sub   { font-size: 10px; opacity: .8; margin-top: 1px; }

.zone-toggle {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px; background: var(--gray-50); border-bottom: 1px solid var(--gray-100);
}
.zone-title { font-size: 13px; font-weight: 600; color: var(--gray-700); }

/* Element list */
.el-row {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 6px; border-radius: 6px; cursor: pointer;
  margin: 2px 2px; border: 1px solid transparent; transition: all .12s;
}
.el-row:hover  { background: var(--gray-50); }
.el-row.active { background: var(--primary-light); border-color: rgba(26,86,219,.2); }
.el-icon { width: 22px; height: 22px; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 11px; }
.t-text  { background:#dbeafe; color:#1d4ed8; }
.t-image { background:#dcfce7; color:#16a34a; }
.t-shape { background:#f3e8ff; color:#7c3aed; }
.el-name { flex: 1; font-size: 12px; color: var(--gray-700); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.el-del  { width:20px; height:20px; border:none; background:transparent; cursor:pointer; color:var(--gray-300); border-radius:3px; opacity:0; transition:.1s; padding:0; font-size:13px; display:flex; align-items:center; justify-content:center; }
.el-row:hover .el-del { opacity: 1; color: var(--gray-400); }
.el-del:hover { background:#fee2e2!important; color:#ef4444!important; }

/* Props panel */
.el-props-panel { border: 1px solid var(--primary); border-radius: 8px; margin: 4px 8px; }
.btn-close-sm { border: none; background: transparent; cursor: pointer; padding: 0; color: var(--gray-400); font-size: 14px; display: flex; align-items: center; margin-left: auto; }
.btn-close-sm:hover { color: #ef4444; }

/* Add buttons */
.add-btn { width:26px; height:26px; border:1px solid var(--gray-200); border-radius:5px; background:white; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:12px; color:var(--gray-500); transition:all .12s; }
.add-btn:hover { background:var(--primary); color:white; border-color:var(--primary); }

/* Page number */
.pn-preview-bar { margin: 12px; border: 1px solid var(--gray-200); border-radius: 8px; background: var(--gray-50); padding: 8px; }
.pn-preview-page { height: 70px; background: white; border: 1px solid var(--gray-200); border-radius: 4px; position: relative; }
.pn-dot { position: absolute; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #888; padding: 2px 6px; background: rgba(255,255,255,.9); border: 1px dashed #ccc; border-radius: 4px; }
.pn-pos-bottom-center { bottom: 4px; left: 50%; transform: translateX(-50%); }
.pn-pos-bottom-right  { bottom: 4px; right: 6px; }
.pn-pos-bottom-left   { bottom: 4px; left: 6px; }
.pn-pos-top-center    { top: 4px; left: 50%; transform: translateX(-50%); }
.pn-pos-top-right     { top: 4px; right: 6px; }
.pn-pos-top-left      { top: 4px; left: 6px; }

.preset-grid { display: flex; flex-wrap: wrap; gap: 4px; }
.preset-chip { padding: 3px 8px; border: 1px solid var(--gray-200); border-radius: 20px; background: white; font-size: 11px; cursor: pointer; color: var(--gray-600); transition: all .12s; white-space: nowrap; }
.preset-chip:hover  { border-color: var(--primary); color: var(--primary); }
.preset-chip.active { background: var(--primary); color: white; border-color: var(--primary); }

.pos-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 5px; }
.pos-btn { padding: 6px 4px; border: 1px solid var(--gray-200); border-radius: 6px; background: var(--gray-50); cursor: pointer; font-size: 10px; font-weight: 500; color: var(--gray-500); transition: all .12s; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 3px; }
.pos-btn i    { font-size: 14px; }
.pos-btn span { font-size: 9px; }
.pos-btn:hover  { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.pos-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

/* Shared */
.toggle-switch { position: relative; width: 36px; height: 20px; cursor: pointer; }
.toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
.toggle-track { position: absolute; inset: 0; border-radius: 10px; background: var(--gray-300); transition: background .2s; }
.toggle-track::after { content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%; background: white; top: 3px; left: 3px; transition: transform .2s; box-shadow: 0 1px 3px rgba(0,0,0,.2); }
.toggle-switch input:checked ~ .toggle-track { background: var(--primary); }
.toggle-switch input:checked ~ .toggle-track::after { transform: translateX(16px); }

.size-spin { display:flex; align-items:center; border:1px solid var(--gray-300); border-radius:6px; overflow:hidden; height:30px; }
.size-spin button { width:26px; height:100%; border:none; background:var(--gray-50); cursor:pointer; font-size:16px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.size-spin button:hover { background:var(--primary-light); color:var(--primary); }
.size-spin input { flex:1; text-align:center; border:none; outline:none; font-size:12px; font-weight:600; -moz-appearance:textfield; padding:0; }
.size-spin input::-webkit-outer-spin-button, .size-spin input::-webkit-inner-spin-button { -webkit-appearance:none; }

.btn-xs { font-size:11px; padding:2px 6px; line-height:1.5; }
code { font-size:10px; background:var(--gray-100); padding:1px 3px; border-radius:3px; }
</style>
