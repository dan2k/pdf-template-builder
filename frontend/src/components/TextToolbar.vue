<template>
  <div class="text-toolbar" v-if="element && element.type === 'text'">
    <!-- Row 1: Font Family + Size -->
    <div class="toolbar-row">
      <!-- Font Family Dropdown -->
      <div class="font-family-select" ref="fontDropRef">
        <button class="font-family-btn" @click="toggleFontDrop">
          <span class="ff-preview" :style="{ fontFamily: cssFontFamily }">{{ currentFontName }}</span>
          <i class="bi bi-chevron-down" style="font-size:9px;opacity:.5"></i>
        </button>
        <div v-if="fontDropOpen" class="font-dropdown-panel">
          <div class="font-search-box">
            <i class="bi bi-search"></i>
            <input ref="fontSearchRef" v-model="fontSearch" placeholder="ค้นหา font..." @click.stop />
          </div>
          <div class="font-group" v-if="thaiFonts.length">
            <div class="font-group-header"><i class="bi bi-globe-asia-australia me-1"></i>ภาษาไทย</div>
            <div v-for="f in thaiFonts" :key="f.key"
              class="font-item" :class="{ active: element.fontFamily === f.key }"
              @click="applyFont(f.key)">
              <span class="font-item-name">{{ f.name }}</span>
              <span class="font-item-preview" :style="{ fontFamily: f.cssFamily }">สวัสดี Abc</span>
            </div>
          </div>
          <div class="font-group" v-if="latinFonts.length">
            <div class="font-group-header"><i class="bi bi-fonts me-1"></i>Latin</div>
            <div v-for="f in latinFonts" :key="f.key"
              class="font-item" :class="{ active: element.fontFamily === f.key }"
              @click="applyFont(f.key)">
              <span class="font-item-name">{{ f.name }}</span>
              <span class="font-item-preview" :style="{ fontFamily: f.cssFamily }">The quick fox</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tb-divider"></div>

      <!-- Font Size -->
      <div class="font-size-group">
        <button class="tb-btn" @click="changeSize(-1)"><i class="bi bi-dash-lg"></i></button>
        <input class="font-size-input" type="number"
          :value="element.fontSize || 12"
          @change="emit('update', { fontSize: +$event.target.value })"
          min="6" max="200" />
        <button class="tb-btn" @click="changeSize(1)"><i class="bi bi-plus-lg"></i></button>
      </div>

      <div class="tb-divider"></div>

      <!-- Text Color -->
      <div class="color-btn-wrap" title="Text Color">
        <button class="color-btn" @click="$refs.textColorRef.click()">
          <span class="color-icon">A</span>
          <span class="color-bar" :style="{ background: element.color || '#000' }"></span>
        </button>
        <input ref="textColorRef" type="color" :value="element.color || '#000000'"
          @input="emit('update', { color: $event.target.value })" style="display:none" />
      </div>

      <!-- BG Color -->
      <div class="color-btn-wrap" title="Background Color">
        <button class="color-btn" @click="$refs.bgColorRef.click()">
          <i class="bi bi-paint-bucket" style="font-size:13px"></i>
          <span class="color-bar" :style="{ background: element.backgroundColor && element.backgroundColor !== 'transparent' ? element.backgroundColor : '#ffffff' }"></span>
        </button>
        <input ref="bgColorRef" type="color" :value="element.backgroundColor || '#ffffff'"
          @input="emit('update', { backgroundColor: $event.target.value })" style="display:none" />
        <button class="tb-btn-xs" title="Clear BG" @click="emit('update', { backgroundColor: 'transparent' })">
          <i class="bi bi-x" style="font-size:11px"></i>
        </button>
      </div>
    </div>

    <!-- Row 2: Style + Align + Decoration + Paragraph -->
    <div class="toolbar-row">
      <!-- Bold, Italic, Underline, Strikethrough -->
      <button class="tb-btn" :class="{ active: element.fontWeight === 'bold' }"
        @click="toggle('fontWeight','bold','normal')" title="Bold (Ctrl+B)">
        <b style="font-size:14px">B</b>
      </button>
      <button class="tb-btn" :class="{ active: element.fontStyle === 'italic' }"
        @click="toggle('fontStyle','italic','normal')" title="Italic (Ctrl+I)">
        <i style="font-size:14px;font-style:italic">I</i>
      </button>
      <button class="tb-btn" :class="{ active: element.textDecoration === 'underline' }"
        @click="toggleDecoration('underline')" title="Underline (Ctrl+U)">
        <span style="text-decoration:underline;font-size:13px">U</span>
      </button>
      <button class="tb-btn" :class="{ active: element.textDecoration === 'line-through' }"
        @click="toggleDecoration('line-through')" title="Strikethrough">
        <span style="text-decoration:line-through;font-size:13px">S</span>
      </button>

      <div class="tb-divider"></div>

      <!-- Alignment -->
      <button class="tb-btn" :class="{ active: (element.align || 'left') === 'left' }"
        @click="emit('update', { align: 'left' })" title="Align Left">
        <i class="bi bi-text-left"></i>
      </button>
      <button class="tb-btn" :class="{ active: element.align === 'center' }"
        @click="emit('update', { align: 'center' })" title="Center">
        <i class="bi bi-text-center"></i>
      </button>
      <button class="tb-btn" :class="{ active: element.align === 'right' }"
        @click="emit('update', { align: 'right' })" title="Align Right">
        <i class="bi bi-text-right"></i>
      </button>
      <button class="tb-btn" :class="{ active: element.align === 'justify' }"
        @click="emit('update', { align: 'justify' })" title="Justify">
        <i class="bi bi-justify"></i>
      </button>

      <div class="tb-divider"></div>

      <!-- Indent -->
      <button class="tb-btn" @click="changeIndent(-1)" title="Decrease Indent">
        <i class="bi bi-text-indent-right"></i>
      </button>
      <button class="tb-btn" @click="changeIndent(1)" title="Increase Indent">
        <i class="bi bi-text-indent-left"></i>
      </button>

      <div class="tb-divider"></div>

      <!-- Line Height -->
      <div class="line-height-group" title="Line Height">
        <i class="bi bi-text-paragraph" style="font-size:12px;color:var(--gray-500)"></i>
        <select class="lh-select"
          :value="element.lineHeight || 1.4"
          @change="emit('update', { lineHeight: +$event.target.value })">
          <option value="1">1.0</option>
          <option value="1.15">1.15</option>
          <option value="1.4">1.4</option>
          <option value="1.5">1.5</option>
          <option value="1.75">1.75</option>
          <option value="2">2.0</option>
          <option value="2.5">2.5</option>
        </select>
      </div>

      <div class="tb-divider"></div>

      <!-- Padding -->
      <div class="padding-group" title="Padding">
        <i class="bi bi-border-all" style="font-size:12px;color:var(--gray-500)"></i>
        <input class="padding-input" type="number"
          :value="element.padding || 0"
          @change="emit('update', { padding: +$event.target.value })"
          min="0" max="60" title="Padding px" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { fontsApi } from '../api'

const props = defineProps({ element: Object })
const emit = defineEmits(['update'])

// ---------- Font list ----------
const fontDropOpen = ref(false)
const fontDropRef = ref(null)
const fontSearchRef = ref(null)
const fontSearch = ref('')
const allFonts = ref([])

const BUILTIN_FONTS = [
  { key: 'Helvetica',   name: 'Helvetica',        language: 'latin', cssFamily: 'Helvetica, Arial, sans-serif' },
  { key: 'Times-Roman', name: 'Times New Roman',  language: 'latin', cssFamily: '"Times New Roman", serif' },
  { key: 'Courier',     name: 'Courier',          language: 'latin', cssFamily: '"Courier New", monospace' },
]
const THAI_FONTS_FALLBACK = [
  { key: 'Sarabun',        name: 'Sarabun',           language: 'thai', cssFamily: 'Sarabun, sans-serif' },
  { key: 'Kanit',          name: 'Kanit',             language: 'thai', cssFamily: 'Kanit, sans-serif' },
  { key: 'Prompt',         name: 'Prompt',            language: 'thai', cssFamily: 'Prompt, sans-serif' },
  { key: 'Mitr',           name: 'Mitr',              language: 'thai', cssFamily: 'Mitr, sans-serif' },
  { key: 'NotoSansThai',   name: 'Noto Sans Thai',    language: 'thai', cssFamily: '"Noto Sans Thai", sans-serif' },
  { key: 'ChakraPetch',    name: 'Chakra Petch',      language: 'thai', cssFamily: '"Chakra Petch", sans-serif' },
  { key: 'Trirong',        name: 'Trirong',           language: 'thai', cssFamily: 'Trirong, serif' },
  { key: 'IBMPlexSansThai',name: 'IBM Plex Sans Thai',language: 'thai', cssFamily: '"IBM Plex Sans Thai", sans-serif' },
]
const CSS_FAMILY_MAP = {
  Helvetica: 'Helvetica, Arial, sans-serif',
  'Times-Roman': '"Times New Roman", serif',
  Courier: '"Courier New", monospace',
  Sarabun: 'Sarabun, sans-serif',
  Kanit: 'Kanit, sans-serif',
  Prompt: 'Prompt, sans-serif',
  Mitr: 'Mitr, sans-serif',
  NotoSansThai: '"Noto Sans Thai", sans-serif',
  ChakraPetch: '"Chakra Petch", sans-serif',
  Trirong: 'Trirong, serif',
  IBMPlexSansThai: '"IBM Plex Sans Thai", sans-serif',
  Roboto: 'Roboto, sans-serif',
  OpenSans: '"Open Sans", sans-serif',
  Lato: 'Lato, sans-serif',
}

onMounted(async () => {
  try {
    const res = await fontsApi.getAll()
    allFonts.value = res.data.map(f => ({
      ...f,
      cssFamily: CSS_FAMILY_MAP[f.key] || f.name + ', sans-serif',
    }))
  } catch {
    allFonts.value = [...BUILTIN_FONTS, ...THAI_FONTS_FALLBACK]
  }
  document.addEventListener('click', onOutsideClick)
})
onUnmounted(() => document.removeEventListener('click', onOutsideClick))

function onOutsideClick(e) {
  if (fontDropRef.value && !fontDropRef.value.contains(e.target)) fontDropOpen.value = false
}

function toggleFontDrop() {
  fontDropOpen.value = !fontDropOpen.value
  if (fontDropOpen.value) {
    fontSearch.value = ''
    nextTick(() => fontSearchRef.value?.focus())
  }
}

const filtered = computed(() =>
  allFonts.value.filter(f => f.name.toLowerCase().includes(fontSearch.value.toLowerCase()))
)
const thaiFonts  = computed(() => filtered.value.filter(f => f.language === 'thai'))
const latinFonts = computed(() => filtered.value.filter(f => f.language === 'latin'))

const currentFontName = computed(() => {
  const f = allFonts.value.find(f => f.key === props.element?.fontFamily)
  return f ? f.name : (props.element?.fontFamily || 'Helvetica')
})
const cssFontFamily = computed(() => CSS_FAMILY_MAP[props.element?.fontFamily] || 'sans-serif')

function applyFont(key) {
  emit('update', { fontFamily: key })
  fontDropOpen.value = false
}

// ---------- Helpers ----------
function changeSize(delta) {
  const s = Math.max(6, Math.min(200, (props.element?.fontSize || 12) + delta))
  emit('update', { fontSize: s })
}

function toggle(prop, on, off) {
  emit('update', { [prop]: props.element[prop] === on ? off : on })
}

function toggleDecoration(val) {
  emit('update', { textDecoration: props.element.textDecoration === val ? 'none' : val })
}

function changeIndent(delta) {
  const cur = props.element.indent || 0
  emit('update', { indent: Math.max(0, Math.min(120, cur + delta * 16)) })
}
</script>

<style scoped>
.text-toolbar {
  background: white;
  border-bottom: 1px solid var(--gray-200);
  padding: 4px 8px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
  position: sticky;
  top: 0;
  z-index: 50;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
}
.toolbar-row::-webkit-scrollbar { display: none; }

/* ---- Font family ---- */
.font-family-select { position: relative; }

.font-family-btn {
  height: 28px;
  min-width: 130px;
  max-width: 170px;
  border: 1px solid var(--gray-200);
  border-radius: 5px;
  background: white;
  padding: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  transition: border-color .15s;
}
.font-family-btn:hover { border-color: var(--primary); }

.ff-preview {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
  font-size: 13px;
}

.font-dropdown-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 260px;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  box-shadow: 0 8px 28px rgba(0,0,0,.16);
  z-index: 9999;
  max-height: 360px;
  overflow-y: auto;
}

.font-search-box {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--gray-100);
  position: sticky;
  top: 0;
  background: white;
  z-index: 1;
}
.font-search-box i { color: var(--gray-400); font-size: 12px; }
.font-search-box input {
  border: none; outline: none; flex: 1;
  font-size: 12px; color: var(--gray-700);
  background: transparent;
}

.font-group { padding: 4px 0; }
.font-group-header {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: var(--gray-400);
  padding: 6px 12px 3px;
  position: sticky;
  top: 44px;
  background: white;
}

.font-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  margin: 1px 4px;
  transition: background .1s;
}
.font-item:hover { background: var(--gray-50); }
.font-item.active { background: var(--primary-light); }
.font-item-name { font-size: 12px; font-weight: 500; color: var(--gray-800); }
.font-item-preview { font-size: 13px; color: var(--gray-400); }

/* ---- Font Size ---- */
.font-size-group {
  display: flex;
  align-items: center;
  border: 1px solid var(--gray-200);
  border-radius: 5px;
  overflow: hidden;
  height: 28px;
}
.font-size-input {
  width: 38px; text-align: center;
  border: none; outline: none;
  font-size: 12px; font-weight: 600;
  color: var(--gray-800);
  -moz-appearance: textfield;
  padding: 0;
}
.font-size-input::-webkit-outer-spin-button,
.font-size-input::-webkit-inner-spin-button { -webkit-appearance: none; }

/* ---- Color buttons ---- */
.color-btn-wrap { display: flex; align-items: center; gap: 1px; }
.color-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--gray-200);
  border-radius: 5px;
  background: white;
  width: 28px; height: 28px;
  cursor: pointer;
  padding: 2px;
  gap: 1px;
  transition: all .12s;
}
.color-btn:hover { border-color: var(--primary); background: var(--primary-light); }
.color-icon { font-size: 13px; font-weight: 700; line-height: 1; }
.color-bar { width: 18px; height: 3px; border-radius: 2px; flex-shrink: 0; }

/* ---- Generic toolbar button ---- */
.tb-btn {
  width: 28px; height: 28px;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  color: var(--gray-700);
  transition: all .12s;
  flex-shrink: 0;
  padding: 0;
}
.tb-btn:hover { background: var(--gray-100); border-color: var(--gray-200); }
.tb-btn.active { background: var(--primary); color: white; border-color: var(--primary); }

.tb-btn-xs {
  width: 16px; height: 16px;
  border: none; background: transparent;
  cursor: pointer; display: flex;
  align-items: center; justify-content: center;
  color: var(--gray-400); border-radius: 3px;
  padding: 0;
}
.tb-btn-xs:hover { background: var(--gray-200); color: var(--gray-600); }

/* ---- Divider ---- */
.tb-divider { width: 1px; height: 18px; background: var(--gray-200); margin: 0 3px; flex-shrink: 0; }

/* ---- Line height ---- */
.line-height-group {
  display: flex; align-items: center; gap: 3px;
  border: 1px solid var(--gray-200);
  border-radius: 5px; padding: 0 6px;
  height: 28px;
}
.lh-select {
  border: none; outline: none;
  font-size: 11px; color: var(--gray-700);
  background: transparent; cursor: pointer;
  padding: 0; width: 40px;
}

/* ---- Padding ---- */
.padding-group {
  display: flex; align-items: center; gap: 4px;
  border: 1px solid var(--gray-200);
  border-radius: 5px; padding: 0 6px;
  height: 28px;
}
.padding-input {
  width: 32px; border: none; outline: none;
  font-size: 11px; font-weight: 600;
  color: var(--gray-700); background: transparent;
  text-align: center;
  -moz-appearance: textfield;
}
.padding-input::-webkit-outer-spin-button,
.padding-input::-webkit-inner-spin-button { -webkit-appearance: none; }
</style>
