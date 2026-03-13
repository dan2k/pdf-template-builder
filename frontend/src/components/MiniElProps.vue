<!-- Compact element property editor used inside Header/Footer editor -->
<template>
  <div class="mep">

    <!-- ── TEXT ─────────────────────────────────────────────────────────── -->
    <template v-if="element.type==='text'">

      <!-- Content -->
      <div class="mep-row">
        <label class="mep-lbl">Content</label>
        <input type="text" class="form-control form-control-sm"
          :value="element.content" @change="u('content',$event.target.value)" />
      </div>

      <!-- Font Family dropdown -->
      <div class="mep-col">
        <label class="mep-lbl-top">Font</label>
        <div class="font-wrap" ref="fontDropRef">
          <button class="font-trigger" @click="toggleDrop" :style="{ fontFamily: cssFontFamily }">
            <span class="font-trigger-name">{{ currentFontName }}</span>
            <i class="bi bi-chevron-down" style="font-size:9px;opacity:.5;flex-shrink:0"></i>
          </button>
          <div v-if="dropOpen" class="font-panel">
            <div class="font-search-row">
              <i class="bi bi-search"></i>
              <input ref="searchRef" v-model="search" placeholder="ค้นหา font..." @click.stop />
            </div>
            <template v-if="thaiFonts.length">
              <div class="font-group-lbl"><i class="bi bi-globe-asia-australia me-1"></i>ภาษาไทย</div>
              <div v-for="f in thaiFonts" :key="f.key"
                class="font-opt" :class="{ active: element.fontFamily===f.key }"
                @click="applyFont(f.key)">
                <span class="font-opt-name">{{ f.name }}</span>
                <span class="font-opt-prev" :style="{ fontFamily: f.cssFamily }">สวัสดี Aa</span>
              </div>
            </template>
            <template v-if="latinFonts.length">
              <div class="font-group-lbl"><i class="bi bi-fonts me-1"></i>Latin</div>
              <div v-for="f in latinFonts" :key="f.key"
                class="font-opt" :class="{ active: element.fontFamily===f.key }"
                @click="applyFont(f.key)">
                <span class="font-opt-name">{{ f.name }}</span>
                <span class="font-opt-prev" :style="{ fontFamily: f.cssFamily }">Quick fox</span>
              </div>
            </template>
            <div v-if="!thaiFonts.length && !latinFonts.length" class="font-empty">ไม่พบ font</div>
          </div>
        </div>
      </div>

      <!-- Font Size + Color -->
      <div class="mep-2col">
        <div>
          <label class="mep-lbl-top">ขนาด</label>
          <div class="size-spin">
            <button @click="u('fontSize',Math.max(6,(element.fontSize||10)-1))">−</button>
            <input type="number" :value="element.fontSize||10"
              @change="u('fontSize',+$event.target.value)" min="6" max="72" />
            <button @click="u('fontSize',Math.min(72,(element.fontSize||10)+1))">+</button>
          </div>
        </div>
        <div>
          <label class="mep-lbl-top">สี</label>
          <div class="d-flex gap-1 align-items-center">
            <input type="color" class="color-swatch"
              :value="element.color||'#000000'"
              @input="u('color',$event.target.value)" />
            <input type="text" class="form-control form-control-sm"
              style="width:68px;font-size:10px;font-family:monospace"
              :value="element.color||'#000000'"
              @change="u('color',$event.target.value)" />
          </div>
        </div>
      </div>

      <!-- B / I / Align -->
      <div class="mep-row">
        <label class="mep-lbl">Style</label>
        <div class="d-flex gap-1 flex-wrap">
          <button class="sty-btn" :class="{active:element.fontWeight==='bold'}"
            @click="u('fontWeight',element.fontWeight==='bold'?'normal':'bold')"><b>B</b></button>
          <button class="sty-btn" :class="{active:element.fontStyle==='italic'}"
            @click="u('fontStyle',element.fontStyle==='italic'?'normal':'italic')"><i>I</i></button>
          <div class="sty-sep"></div>
          <button class="sty-btn" :class="{active:(element.align||'left')==='left'}"
            @click="u('align','left')"><i class="bi bi-text-left"></i></button>
          <button class="sty-btn" :class="{active:element.align==='center'}"
            @click="u('align','center')"><i class="bi bi-text-center"></i></button>
          <button class="sty-btn" :class="{active:element.align==='right'}"
            @click="u('align','right')"><i class="bi bi-text-right"></i></button>
        </div>
      </div>
    </template>

    <!-- ── SHAPE / LINE ──────────────────────────────────────────────────── -->
    <template v-if="element.type==='shape'">
      <template v-if="element.shape !== 'line'">
        <div class="mep-row">
          <label class="mep-lbl">Fill</label>
          <div class="d-flex gap-2 align-items-center">
            <input type="color" class="color-swatch"
              :value="element.fillColor&&element.fillColor!=='transparent'?element.fillColor:'#e5e7eb'"
              @input="u('fillColor',$event.target.value)" />
            <button class="btn btn-xs btn-outline-secondary"
              @click="u('fillColor','transparent')">None</button>
          </div>
        </div>
      </template>
      <div class="mep-row">
        <label class="mep-lbl">Stroke</label>
        <div class="d-flex gap-2 align-items-center">
          <input type="color" class="color-swatch"
            :value="element.strokeColor||'#9ca3af'"
            @input="u('strokeColor',$event.target.value)" />
          <input type="number" class="form-control form-control-sm" style="width:55px"
            :value="element.strokeWidth||1"
            @change="u('strokeWidth',+$event.target.value)" min="0" max="20" />
        </div>
      </div>
    </template>

    <!-- ── IMAGE ────────────────────────────────────────────────────────── -->
    <template v-if="element.type==='image'">
      <div class="mep-row">
        <label class="mep-lbl">URL / Var</label>
        <input type="text" class="form-control form-control-sm"
          :value="element.src||''" @change="u('src',$event.target.value)"
          placeholder="https://... หรือ variable" />
      </div>
      <div class="mep-row">
        <label class="mep-lbl">Fit</label>
        <select class="form-select form-select-sm mep-ctrl"
          :value="element.objectFit||'contain'" @change="u('objectFit',$event.target.value)">
          <option value="contain">Contain</option>
          <option value="cover">Cover</option>
          <option value="fill">Fill</option>
        </select>
      </div>
    </template>

    <!-- ── Position & Size (all types) ──────────────────────────────────── -->
    <div class="mep-divider"></div>
    <div class="mep-row">
      <label class="mep-lbl">X / Y</label>
      <div class="d-flex gap-1">
        <input type="number" class="form-control form-control-sm" style="width:58px"
          :value="element.x||0" @change="u('x',+$event.target.value)" placeholder="X" />
        <input type="number" class="form-control form-control-sm" style="width:58px"
          :value="element.y||0" @change="u('y',+$event.target.value)" placeholder="Y" />
      </div>
    </div>
    <div class="mep-row">
      <label class="mep-lbl">W / H</label>
      <div class="d-flex gap-1">
        <input type="number" class="form-control form-control-sm" style="width:58px"
          :value="element.width||100" @change="u('width',+$event.target.value)" min="10" placeholder="W" />
        <input type="number" class="form-control form-control-sm" style="width:58px"
          :value="element.height||20" @change="u('height',+$event.target.value)" min="2" placeholder="H" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { fontsApi } from '../api'

const props = defineProps({ element: Object })
const emit  = defineEmits(['update'])
function u(key, val) { emit('update', { [key]: val }) }

// ── Font data ─────────────────────────────────────────────────────────────────
const CSS_MAP = {
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

const allFonts = ref([])

onMounted(async () => {
  try {
    const res = await fontsApi.getAll()
    allFonts.value = res.data.map(f => ({
      ...f, cssFamily: CSS_MAP[f.key] || f.name + ', sans-serif'
    }))
  } catch {
    allFonts.value = [
      { key: 'Helvetica',   name: 'Helvetica',       language: 'latin', cssFamily: 'Helvetica, Arial, sans-serif' },
      { key: 'Times-Roman', name: 'Times New Roman',  language: 'latin', cssFamily: '"Times New Roman", serif' },
      { key: 'Courier',     name: 'Courier',          language: 'latin', cssFamily: '"Courier New", monospace' },
      { key: 'Sarabun',     name: 'Sarabun',          language: 'thai',  cssFamily: 'Sarabun, sans-serif' },
      { key: 'Kanit',       name: 'Kanit',            language: 'thai',  cssFamily: 'Kanit, sans-serif' },
      { key: 'Prompt',      name: 'Prompt',           language: 'thai',  cssFamily: 'Prompt, sans-serif' },
      { key: 'Mitr',        name: 'Mitr',             language: 'thai',  cssFamily: 'Mitr, sans-serif' },
    ]
  }
  document.addEventListener('click', onOutside)
})
onUnmounted(() => document.removeEventListener('click', onOutside))

// ── Dropdown state ────────────────────────────────────────────────────────────
const dropOpen   = ref(false)
const search     = ref('')
const fontDropRef = ref(null)
const searchRef  = ref(null)

function onOutside(e) {
  if (fontDropRef.value && !fontDropRef.value.contains(e.target)) dropOpen.value = false
}

function toggleDrop() {
  dropOpen.value = !dropOpen.value
  if (dropOpen.value) { search.value = ''; nextTick(() => searchRef.value?.focus()) }
}

// ── Filtered lists ────────────────────────────────────────────────────────────
const filtered   = computed(() =>
  allFonts.value.filter(f => f.name.toLowerCase().includes(search.value.toLowerCase()))
)
const thaiFonts  = computed(() => filtered.value.filter(f => f.language === 'thai'))
const latinFonts = computed(() => filtered.value.filter(f => f.language === 'latin'))

const currentFontName = computed(() =>
  allFonts.value.find(f => f.key === props.element?.fontFamily)?.name
  || props.element?.fontFamily || 'Helvetica'
)
const cssFontFamily = computed(() =>
  CSS_MAP[props.element?.fontFamily] || 'sans-serif'
)

function applyFont(key) {
  u('fontFamily', key)
  dropOpen.value = false
}
</script>

<style scoped>
.mep { display: flex; flex-direction: column; gap: 6px; }

/* Row layouts */
.mep-row  { display: flex; align-items: center; gap: 8px; min-height: 28px; }
.mep-col  { display: flex; flex-direction: column; gap: 3px; }
.mep-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.mep-lbl     { font-size: 11px; color: var(--gray-500); width: 58px; flex-shrink: 0; }
.mep-lbl-top { font-size: 11px; color: var(--gray-500); margin-bottom: 2px; display: block; }
.mep-ctrl    { max-width: 100px; }
.mep-divider { height: 1px; background: var(--gray-100); margin: 4px 0; }

/* Font dropdown */
.font-wrap    { position: relative; }
.font-trigger {
  width: 100%; height: 30px;
  border: 1px solid var(--gray-300); border-radius: 6px;
  background: white; padding: 0 8px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; transition: border-color .15s;
}
.font-trigger:hover { border-color: var(--primary); }
.font-trigger-name {
  flex: 1; overflow: hidden; text-overflow: ellipsis;
  white-space: nowrap; text-align: left;
}
.font-panel {
  position: absolute; top: calc(100% + 3px); left: 0; right: 0;
  min-width: 210px; background: white;
  border: 1px solid var(--gray-200); border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.14);
  z-index: 9999; max-height: 280px; overflow-y: auto;
}
.font-search-row {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px; border-bottom: 1px solid var(--gray-100);
  position: sticky; top: 0; background: white; z-index: 1;
}
.font-search-row i { color: var(--gray-400); font-size: 11px; }
.font-search-row input {
  border: none; outline: none; flex: 1; font-size: 12px; background: transparent;
}
.font-group-lbl {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: var(--gray-400);
  padding: 5px 10px 2px; position: sticky; top: 36px; background: white;
}
.font-opt {
  display: flex; align-items: center; justify-content: space-between;
  padding: 5px 10px; cursor: pointer; border-radius: 4px; margin: 1px 4px;
  transition: background .1s;
}
.font-opt:hover  { background: var(--gray-50); }
.font-opt.active { background: var(--primary-light); }
.font-opt-name   { font-size: 12px; font-weight: 500; color: var(--gray-800); }
.font-opt-prev   { font-size: 12px; color: var(--gray-400); }
.font-empty      { padding: 16px; text-align: center; font-size: 12px; color: var(--gray-400); }

/* Size spinner */
.size-spin {
  display: flex; align-items: center;
  border: 1px solid var(--gray-300); border-radius: 6px; overflow: hidden; height: 28px;
}
.size-spin button {
  width: 24px; height: 100%; border: none; background: var(--gray-50); cursor: pointer;
  font-size: 14px; display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; padding: 0; transition: background .1s;
}
.size-spin button:hover { background: var(--primary-light); color: var(--primary); }
.size-spin input {
  flex: 1; text-align: center; border: none; outline: none;
  font-size: 12px; font-weight: 600; -moz-appearance: textfield; padding: 0; min-width: 0;
}
.size-spin input::-webkit-outer-spin-button,
.size-spin input::-webkit-inner-spin-button { -webkit-appearance: none; }

/* Style buttons */
.sty-btn {
  width: 26px; height: 26px; border: 1px solid var(--gray-200); border-radius: 4px;
  background: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--gray-600); padding: 0; transition: all .1s;
}
.sty-btn:hover  { background: var(--primary-light); border-color: var(--primary); }
.sty-btn.active { background: var(--primary); color: white; border-color: var(--primary); }
.sty-sep { width: 1px; height: 18px; background: var(--gray-200); margin: 0 2px; }

.btn-xs { font-size: 11px; padding: 2px 6px; line-height: 1.5; }
</style>
