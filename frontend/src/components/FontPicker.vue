<template>
  <div class="font-picker">
    <div class="font-select-row">
      <!-- Font Family -->
      <div class="font-family-wrap">
        <div class="picker-label">Font</div>
        <div class="font-dropdown" :class="{ open: isOpen }" ref="dropdownRef">
          <button class="font-trigger" @click="isOpen = !isOpen" :style="{ fontFamily: previewFontFamily }">
            <span class="font-name-preview">{{ selectedFont?.name || fontKey }}</span>
            <i class="bi bi-chevron-down chevron" :class="{ rotated: isOpen }"></i>
          </button>
          <div v-if="isOpen" class="font-list-popup">
            <!-- Search -->
            <div class="font-search">
              <i class="bi bi-search"></i>
              <input v-model="search" type="text" placeholder="Search fonts..." @click.stop ref="searchInput" />
            </div>
            <!-- Thai fonts -->
            <div v-if="thaiFiltered.length">
              <div class="font-group-label">
                <i class="bi bi-globe2 me-1"></i>Thai Fonts
                <span class="font-count">{{ thaiFiltered.length }}</span>
              </div>
              <div
                v-for="f in thaiFiltered" :key="f.key"
                class="font-option"
                :class="{ active: f.key === fontKey }"
                @click="selectFont(f)"
              >
                <div class="font-option-name" :style="{ fontFamily: f.key === 'Sarabun' || f.key === 'Kanit' || f.key === 'Prompt' || f.key === 'Mitr' || f.key === 'NotoSansThai' ? 'inherit' : 'inherit' }">
                  {{ f.name }}
                </div>
                <div class="font-option-preview thai-preview">
                  สวัสดี / Hello
                </div>
                <div v-if="f.key === fontKey" class="font-check"><i class="bi bi-check2"></i></div>
              </div>
            </div>
            <!-- Latin fonts -->
            <div v-if="latinFiltered.length">
              <div class="font-group-label">
                <i class="bi bi-fonts me-1"></i>Latin Fonts
                <span class="font-count">{{ latinFiltered.length }}</span>
              </div>
              <div
                v-for="f in latinFiltered" :key="f.key"
                class="font-option"
                :class="{ active: f.key === fontKey }"
                @click="selectFont(f)"
              >
                <div class="font-option-name">{{ f.name }}</div>
                <div class="font-option-preview">The quick brown fox</div>
                <div v-if="f.key === fontKey" class="font-check"><i class="bi bi-check2"></i></div>
              </div>
            </div>
            <!-- No results -->
            <div v-if="!thaiFiltered.length && !latinFiltered.length" class="font-empty">
              No fonts found
            </div>
          </div>
        </div>
      </div>

      <!-- Font Size -->
      <div class="font-size-wrap">
        <div class="picker-label">Size</div>
        <div class="size-control">
          <button class="size-btn" @click="adjustSize(-1)">−</button>
          <input
            type="number"
            class="size-input"
            :value="fontSize"
            @change="$emit('update-size', +$event.target.value)"
            min="6" max="120"
          />
          <button class="size-btn" @click="adjustSize(1)">+</button>
        </div>
      </div>
    </div>

    <!-- Style buttons -->
    <div class="style-row">
      <button
        class="style-btn" :class="{ active: fontWeight === 'bold' }"
        @click="$emit('update-weight', fontWeight === 'bold' ? 'normal' : 'bold')"
        title="Bold"
      ><b>B</b></button>
      <button
        class="style-btn" :class="{ active: fontStyle === 'italic' }"
        @click="$emit('update-style', fontStyle === 'italic' ? 'normal' : 'italic')"
        title="Italic"
      ><i>I</i></button>
      <div class="vr"></div>
      <button
        v-for="a in ['left','center','right','justify']" :key="a"
        class="style-btn" :class="{ active: textAlign === a }"
        @click="$emit('update-align', a)"
        :title="a"
      ><i :class="'bi bi-text-' + (a === 'justify' ? 'justify' : a)"></i></button>
    </div>

    <!-- Thai font warning if not downloaded -->
    <div v-if="selectedFont && selectedFont.language === 'thai' && !selectedFont.hasRegular" class="thai-warning">
      <i class="bi bi-exclamation-triangle-fill me-1"></i>
      Font not downloaded. Run <code>node download-fonts.js</code> in backend folder.
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { fontsApi } from '../api'

const props = defineProps({
  fontKey: { type: String, default: 'Helvetica' },
  fontSize: { type: Number, default: 12 },
  fontWeight: { type: String, default: 'normal' },
  fontStyle: { type: String, default: 'normal' },
  textAlign: { type: String, default: 'left' },
})

const emit = defineEmits(['update-font', 'update-size', 'update-weight', 'update-style', 'update-align'])

const fonts = ref([])
const isOpen = ref(false)
const search = ref('')
const dropdownRef = ref(null)
const searchInput = ref(null)

onMounted(async () => {
  try {
    const res = await fontsApi.getAll()
    fonts.value = res.data
  } catch (e) {
    // fallback list
    fonts.value = [
      { name: 'Helvetica', key: 'Helvetica', language: 'latin', hasRegular: true },
      { name: 'Times New Roman', key: 'Times-Roman', language: 'latin', hasRegular: true },
      { name: 'Courier', key: 'Courier', language: 'latin', hasRegular: true },
      { name: 'Sarabun', key: 'Sarabun', language: 'thai', hasRegular: false },
      { name: 'Kanit', key: 'Kanit', language: 'thai', hasRegular: false },
      { name: 'Prompt', key: 'Prompt', language: 'thai', hasRegular: false },
    ]
  }
  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})

function handleOutsideClick(e) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target)) {
    isOpen.value = false
  }
}

watch(isOpen, (val) => {
  if (val) {
    search.value = ''
    nextTick(() => searchInput.value?.focus())
  }
})

const selectedFont = computed(() => fonts.value.find(f => f.key === props.fontKey))

const previewFontFamily = computed(() => {
  // For Thai fonts loaded via Google Fonts in browser
  const thaiMap = {
    Sarabun: 'Sarabun', Kanit: 'Kanit', Prompt: 'Prompt',
    Mitr: 'Mitr', NotoSansThai: 'Noto Sans Thai',
  }
  return thaiMap[props.fontKey] || props.fontKey
})

const thaiFiltered = computed(() =>
  fonts.value.filter(f =>
    f.language === 'thai' &&
    f.name.toLowerCase().includes(search.value.toLowerCase())
  )
)

const latinFiltered = computed(() =>
  fonts.value.filter(f =>
    f.language === 'latin' &&
    f.name.toLowerCase().includes(search.value.toLowerCase())
  )
)

function selectFont(f) {
  emit('update-font', f.key)
  isOpen.value = false
}

function adjustSize(delta) {
  const newSize = Math.min(120, Math.max(6, (props.fontSize || 12) + delta))
  emit('update-size', newSize)
}
</script>

<style scoped>
.font-picker { display: flex; flex-direction: column; gap: 8px; }

.font-select-row { display: flex; gap: 8px; align-items: flex-end; }
.font-family-wrap { flex: 1; min-width: 0; }
.font-size-wrap { flex-shrink: 0; }

.picker-label {
  font-size: 11px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

/* Dropdown */
.font-dropdown { position: relative; }

.font-trigger {
  width: 100%;
  height: 32px;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  background: white;
  padding: 0 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  font-size: 13px;
  text-align: left;
  transition: border-color .15s;
}
.font-trigger:hover { border-color: var(--primary); }
.font-dropdown.open .font-trigger { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(26,86,219,.12); }

.font-name-preview { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.chevron { font-size: 10px; color: var(--gray-400); transition: transform .2s; flex-shrink: 0; }
.chevron.rotated { transform: rotate(180deg); }

.font-list-popup {
  position: absolute;
  top: calc(100% + 4px);
  left: 0; right: 0;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,.15);
  z-index: 1000;
  max-height: 320px;
  overflow-y: auto;
  min-width: 200px;
}

.font-search {
  position: sticky;
  top: 0;
  background: white;
  padding: 8px;
  border-bottom: 1px solid var(--gray-100);
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 1;
}
.font-search i { color: var(--gray-400); font-size: 12px; }
.font-search input {
  border: none; outline: none;
  font-size: 12px; flex: 1;
  color: var(--gray-700);
}

.font-group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: var(--gray-400);
  padding: 8px 10px 4px;
  display: flex;
  align-items: center;
  gap: 4px;
  position: sticky;
  top: 45px;
  background: white;
}
.font-count {
  margin-left: auto;
  background: var(--gray-100);
  color: var(--gray-500);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
}

.font-option {
  padding: 6px 10px;
  cursor: pointer;
  transition: background .1s;
  position: relative;
  border-radius: 4px;
  margin: 1px 4px;
}
.font-option:hover { background: var(--gray-50); }
.font-option.active { background: var(--primary-light); }

.font-option-name { font-size: 13px; font-weight: 500; color: var(--gray-800); }
.font-option-preview { font-size: 11px; color: var(--gray-400); margin-top: 1px; }
.thai-preview { font-family: inherit; }

.font-check {
  position: absolute;
  right: 10px; top: 50%;
  transform: translateY(-50%);
  color: var(--primary);
  font-size: 14px;
}

.font-empty { padding: 16px; text-align: center; color: var(--gray-400); font-size: 12px; }

/* Size control */
.size-control {
  display: flex;
  align-items: center;
  border: 1px solid var(--gray-300);
  border-radius: 6px;
  overflow: hidden;
  height: 32px;
}
.size-btn {
  width: 24px; height: 100%;
  border: none;
  background: var(--gray-50);
  color: var(--gray-600);
  cursor: pointer;
  font-size: 16px;
  display: flex; align-items: center; justify-content: center;
  transition: background .1s;
  flex-shrink: 0;
}
.size-btn:hover { background: var(--primary-light); color: var(--primary); }
.size-input {
  width: 40px;
  text-align: center;
  border: none; outline: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-700);
  -moz-appearance: textfield;
  padding: 0;
}

/* Style row */
.style-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.style-btn {
  width: 30px; height: 30px;
  border: 1px solid var(--gray-200);
  border-radius: 5px;
  background: white;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px;
  transition: all .12s;
  color: var(--gray-600);
  flex-shrink: 0;
}
.style-btn:hover { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
.style-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
.vr { width: 1px; height: 20px; background: var(--gray-200); margin: 0 2px; }

/* Thai warning */
.thai-warning {
  background: #fef3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 11px;
  color: #856404;
}
.thai-warning code {
  background: rgba(0,0,0,.08);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 10px;
}
</style>
