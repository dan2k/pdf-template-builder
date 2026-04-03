<template>
  <div class="rich-editor">
    <!-- Toolbar -->
    <div class="re-toolbar">
      <select class="re-select" v-model="newBlockType" @change="addBlock" title="เพิ่ม Block">
        <option value="" disabled>+ เพิ่ม...</option>
        <option value="paragraph">ย่อหน้า</option>
        <option value="heading1">หัวข้อ H1</option>
        <option value="heading2">หัวข้อ H2</option>
        <option value="heading3">หัวข้อ H3</option>
        <optgroup label="Unordered List">
          <option value="list-disc">● Disc (จุดทึบ)</option>
          <option value="list-circle">○ Circle (จุดกลวง)</option>
          <option value="list-square">■ Square (สี่เหลี่ยม)</option>
          <option value="list-dash">– Dash (ขีด)</option>
          <option value="list-arrow">▸ Arrow (ลูกศร)</option>
          <option value="list-check">✓ Check (เครื่องหมายถูก)</option>
          <option value="list-checkbox">☑ Checkbox</option>
          <option value="list-radio">◉ Radio</option>
        </optgroup>
        <optgroup label="Ordered List">
          <option value="list-decimal">1. ตัวเลข</option>
          <option value="list-decimal-zero">01. ตัวเลข (นำศูนย์)</option>
          <option value="list-lower-alpha">a. ตัวอักษรเล็ก</option>
          <option value="list-upper-alpha">A. ตัวอักษรใหญ่</option>
          <option value="list-lower-roman">i. โรมันเล็ก</option>
          <option value="list-upper-roman">I. โรมันใหญ่</option>
          <option value="list-thai">๑. ตัวเลขไทย</option>
        </optgroup>
      </select>
    </div>

    <!-- Blocks -->
    <div class="re-blocks">
      <div v-for="(block, idx) in blocks" :key="idx" class="re-block" :class="'re-block-' + block.type">
        <div class="re-block-header">
          <span class="re-block-badge">
            <template v-if="block.type === 'heading'">H{{ block.level }}</template>
            <template v-else-if="block.type === 'list'">{{ getStyleLabel(block.style) }}</template>
            <template v-else>¶</template>
          </span>

          <!-- Block-level controls -->
          <div class="re-block-controls">
            <button class="re-btn-tiny" :class="{ active: block.bold }" @click="toggleProp(idx, 'bold')" title="Bold"><b>B</b></button>
            <button class="re-btn-tiny" :class="{ active: block.italic }" @click="toggleProp(idx, 'italic')" title="Italic"><i>I</i></button>
            <select class="re-mini-select" :value="block.align || 'left'" @change="updateBlock(idx, 'align', $event.target.value)" title="จัดตำแหน่ง">
              <option value="left">◀</option>
              <option value="center">◆</option>
              <option value="right">▶</option>
            </select>
            <button class="re-btn-tiny" @click="changeIndent(idx, 1)" title="เพิ่มย่อหน้า">→</button>
            <button class="re-btn-tiny" @click="changeIndent(idx, -1)" title="ลดย่อหน้า">←</button>
            <input type="color" class="re-color-tiny" :value="block.color || '#000000'" @input="updateBlock(idx, 'color', $event.target.value)" title="สี" />
            <button class="re-btn-tiny" @click="moveBlock(idx, -1)" :disabled="idx === 0" title="ขึ้น">↑</button>
            <button class="re-btn-tiny" @click="moveBlock(idx, 1)" :disabled="idx === blocks.length - 1" title="ลง">↓</button>
            <button class="re-btn-tiny re-btn-del" @click="removeBlock(idx)" title="ลบ">×</button>
          </div>
        </div>

        <!-- Content area -->
        <div class="re-block-body" :style="{ paddingLeft: (block.indent || 0) * 20 + 'px' }">
          <!-- Heading / Paragraph -->
          <template v-if="block.type === 'heading' || block.type === 'paragraph'">
            <textarea
              class="re-textarea"
              :class="{ 're-h1': block.type==='heading' && block.level===1, 're-h2': block.type==='heading' && block.level===2, 're-h3': block.type==='heading' && block.level===3 }"
              :style="getBlockTextStyle(block)"
              :value="block.text"
              @input="updateBlock(idx, 'text', $event.target.value); autoResize($event)"
              :placeholder="block.type === 'heading' ? 'หัวข้อ...' : 'เนื้อหา... (ใช้ {{variable}} ได้)'"
              rows="1"
            ></textarea>
          </template>

          <!-- List -->
          <template v-if="block.type === 'list'">
            <!-- List style changer -->
            <div class="re-list-options">
              <select class="re-mini-select" :value="block.style" @change="updateBlock(idx, 'style', $event.target.value)" title="เปลี่ยน style">
                <optgroup label="Unordered">
                  <option value="disc">● Disc</option>
                  <option value="circle">○ Circle</option>
                  <option value="square">■ Square</option>
                  <option value="dash">– Dash</option>
                  <option value="arrow">▸ Arrow</option>
                  <option value="check">✓ Check</option>
                  <option value="checkbox">☑ Checkbox</option>
                  <option value="radio">◉ Radio</option>
                </optgroup>
                <optgroup label="Ordered">
                  <option value="decimal">1. ตัวเลข</option>
                  <option value="decimal-zero">01. นำศูนย์</option>
                  <option value="lower-alpha">a. อักษรเล็ก</option>
                  <option value="upper-alpha">A. อักษรใหญ่</option>
                  <option value="lower-roman">i. โรมันเล็ก</option>
                  <option value="upper-roman">I. โรมันใหญ่</option>
                  <option value="thai">๑. เลขไทย</option>
                </optgroup>
              </select>
              <template v-if="isOrderedStyle(block.style)">
                <label class="re-tiny-label">เริ่มที่:</label>
                <input type="number" class="re-num-input" :value="block.startNumber || 1" @change="updateBlock(idx, 'startNumber', +$event.target.value)" min="1" />
              </template>
            </div>

            <!-- Dynamic binding toggle -->
            <div class="re-dynamic-section">
              <div class="re-dynamic-toggle">
                <label class="re-tiny-label">
                  <input type="checkbox" :checked="block.dataKey !== undefined" @change="toggleDynamic(idx, $event.target.checked)" />
                  Dynamic (ดึงจากตัวแปร)
                </label>
              </div>
              <template v-if="block.dataKey !== undefined">
                <div class="re-dynamic-fields">
                  <div class="re-field-row">
                    <label class="re-tiny-label">Data Key:</label>
                    <input type="text" class="re-text-input" :value="block.dataKey" @input="updateBlock(idx, 'dataKey', $event.target.value)" placeholder="เช่น features, order.items" />
                  </div>
                  <div class="re-field-row">
                    <label class="re-tiny-label">Item Template:</label>
                    <input type="text" class="re-text-input" :value="block.itemTemplate || '\u007B\u007B.\u007D\u007D'" @input="updateBlock(idx, 'itemTemplate', $event.target.value)" :placeholder="dynamicPlaceholder" />
                  </div>
                  <div v-if="isCheckableStyle(block.style)" class="re-field-row">
                    <label class="re-tiny-label">Checked Key:</label>
                    <input type="text" class="re-text-input" :value="block.checkedKey || ''" @input="updateBlock(idx, 'checkedKey', $event.target.value)" placeholder="เช่น selectedItems" />
                  </div>
                  <div class="re-hint-box">
                    <div class="re-hint-title">ตัวอย่างการใช้งาน:</div>
                    <pre class="re-hint-code" v-pre>// Array ธรรมดา (dataKey: "features", template: "{{.}}")
{ "features": ["Fast", "Secure", "Easy"] }

// Array of objects (dataKey: "items", template: "{{name}}")
{ "items": [
    { "name": "Option A", "checked": true },
    { "name": "Option B", "checked": false }
  ]
}

// Checkbox/Radio with checkedKey:
// dataKey: "options", checkedKey: "selected"
{ "options": ["A", "B", "C"],
  "selected": ["A", "C"]
}</pre>
                  </div>
                </div>
              </template>
            </div>

            <!-- Static items (when not dynamic) -->
            <template v-if="block.dataKey === undefined">
              <div v-for="(item, li) in normalizeItems(block.items)" :key="li" class="re-list-item">
                <div class="re-item-indent-controls">
                  <button class="re-btn-micro" @click="changeItemIndent(idx, li, -1)" title="ลด level">‹</button>
                  <button class="re-btn-micro" @click="changeItemIndent(idx, li, 1)" title="เพิ่ม level">›</button>
                </div>
                <!-- Checked toggle for checkbox/radio -->
                <button v-if="isCheckableStyle(block.style)" class="re-check-toggle" :class="{ checked: item.checked }" @click="toggleItemChecked(idx, li)" :title="item.checked ? 'Uncheck' : 'Check'">
                  <i v-if="block.style === 'checkbox'" class="bi" :class="item.checked ? 'bi-check-square-fill' : 'bi-square'"></i>
                  <i v-else class="bi" :class="item.checked ? 'bi-record-circle-fill' : 'bi-circle'"></i>
                </button>
                <span v-else class="re-list-marker" :style="{ paddingLeft: (item.indent || 0) * 16 + 'px' }">{{ getMarker(block.style, li, item.indent || 0, block.startNumber || 1) }}</span>
                <input
                  class="re-list-input"
                  :style="getBlockTextStyle(block)"
                  :value="item.text"
                  @input="updateListItem(idx, li, $event.target.value)"
                  @keydown.enter.prevent="addListItem(idx, li)"
                  @keydown.backspace="onListBackspace($event, idx, li)"
                  :placeholder="'รายการที่ ' + (li + 1) + ' (ใช้ {{var}} ได้)'"
                />
              </div>
              <button class="re-btn-add-item" @click="addListItem(idx, normalizeItems(block.items).length - 1)">+ เพิ่มรายการ</button>
            </template>
          </template>
        </div>
      </div>

      <div v-if="!blocks.length" class="re-empty" @click="addDefaultBlock">
        <i class="bi bi-plus-circle"></i>
        <span>คลิกเพื่อเพิ่ม content block</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Array, default: () => [] }
})
const emit = defineEmits(['update:modelValue'])

const blocks = computed(() => props.modelValue || [])

const newBlockType = computed({ get: () => '', set: () => {} })

const dynamicPlaceholder = '{{.}} หรือ {{name}} - {{qty}}'

function emitUpdate(newBlocks) {
  emit('update:modelValue', [...newBlocks])
}

// ── List style helpers ──────────────────────────────────────────────────────
const STYLE_LABELS = {
  disc: '●', circle: '○', square: '■', dash: '–', arrow: '▸', check: '✓',
  checkbox: '☑', radio: '◉',
  decimal: '1.', 'decimal-zero': '01.', 'lower-alpha': 'a.', 'upper-alpha': 'A.',
  'lower-roman': 'i.', 'upper-roman': 'I.', thai: '๑.',
}

const UNORDERED_MARKERS = {
  disc:   ['●', '○', '■'],
  circle: ['○', '◦', '▪'],
  square: ['■', '▪', '▫'],
  dash:   ['–', '–', '–'],
  arrow:  ['▸', '▹', '▸'],
  check:  ['✓', '✓', '✓'],
}

const THAI_DIGITS = ['๐','๑','๒','๓','๔','๕','๖','๗','๘','๙']

function toThai(n) { return String(n).split('').map(d => THAI_DIGITS[+d]).join('') }
function toRoman(n, upper) {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1]
  const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I']
  let r = ''; for (let i = 0; i < vals.length; i++) { while (n >= vals[i]) { r += syms[i]; n -= vals[i] } }
  return upper ? r : r.toLowerCase()
}
function toAlpha(n, upper) {
  let r = ''; while (n > 0) { n--; r = String.fromCharCode(65 + (n % 26)) + r; n = Math.floor(n / 26) }
  return upper ? r : r.toLowerCase()
}

function isOrderedStyle(s) {
  return ['decimal','decimal-zero','lower-alpha','upper-alpha','lower-roman','upper-roman','thai'].includes(s)
}

function getStyleLabel(s) { return STYLE_LABELS[s] || s }

function getMarker(style, index, level, startNum) {
  if (isOrderedStyle(style)) {
    const num = (startNum || 1) + index
    switch (style) {
      case 'decimal':      return `${num}.`
      case 'decimal-zero': return `${String(num).padStart(2, '0')}.`
      case 'lower-alpha':  return `${toAlpha(num, false)}.`
      case 'upper-alpha':  return `${toAlpha(num, true)}.`
      case 'lower-roman':  return `${toRoman(num, false)}.`
      case 'upper-roman':  return `${toRoman(num, true)}.`
      case 'thai':         return `${toThai(num)}.`
      default:             return `${num}.`
    }
  }
  const chars = UNORDERED_MARKERS[style] || UNORDERED_MARKERS['disc']
  return chars[Math.min(level || 0, chars.length - 1)]
}

// Normalize items: support both string[] (legacy) and ListItem[]
function normalizeItems(items) {
  if (!items || !items.length) return [{ text: '', indent: 0, checked: false }]
  return items.map(it => typeof it === 'string' ? { text: it, indent: 0, checked: false } : { text: it.text || '', indent: it.indent || 0, style: it.style, checked: !!it.checked })
}

function isCheckableStyle(style) {
  return style === 'checkbox' || style === 'radio'
}

function toggleItemChecked(blockIdx, itemIdx) {
  const arr = blocks.value.map((b, i) => {
    if (i !== blockIdx) return b
    const items = normalizeItems(b.items).map((it, li) => {
      if (li !== itemIdx) {
        // For radio: uncheck all others
        if (b.style === 'radio') return { ...it, checked: false }
        return it
      }
      return { ...it, checked: !it.checked }
    })
    return { ...b, items }
  })
  emitUpdate(arr)
}

// ── Block CRUD ──────────────────────────────────────────────────────────────
function addBlock(e) {
  const val = e.target.value
  e.target.value = ''
  if (!val) return
  const arr = [...blocks.value]
  let block
  if (val === 'paragraph') {
    block = { type: 'paragraph', text: '', align: 'left', indent: 0 }
  } else if (val.startsWith('heading')) {
    const level = parseInt(val.charAt(val.length - 1))
    block = { type: 'heading', level, text: '', align: 'left', indent: 0 }
  } else if (val.startsWith('list-')) {
    const style = val.replace('list-', '')
    block = { type: 'list', style, items: [{ text: '', indent: 0 }], align: 'left', indent: 0 }
  }
  if (block) { arr.push(block); emitUpdate(arr) }
}

function addDefaultBlock() {
  emitUpdate([{ type: 'paragraph', text: '', align: 'left', indent: 0 }])
}

function updateBlock(idx, key, val) {
  const arr = blocks.value.map((b, i) => i === idx ? { ...b, [key]: val } : b)
  emitUpdate(arr)
}

function toggleProp(idx, prop) {
  const b = blocks.value[idx]
  updateBlock(idx, prop, !b[prop])
}

function changeIndent(idx, delta) {
  const b = blocks.value[idx]
  updateBlock(idx, 'indent', Math.max(0, Math.min(4, (b.indent || 0) + delta)))
}

function moveBlock(idx, dir) {
  const arr = [...blocks.value]
  const target = idx + dir
  if (target < 0 || target >= arr.length) return
  ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
  emitUpdate(arr)
}

function removeBlock(idx) {
  emitUpdate(blocks.value.filter((_, i) => i !== idx))
}

// ── List item CRUD ──────────────────────────────────────────────────────────
function updateListItem(blockIdx, itemIdx, val) {
  const arr = blocks.value.map((b, i) => {
    if (i !== blockIdx) return b
    const items = normalizeItems(b.items).map((it, li) => li === itemIdx ? { ...it, text: val } : it)
    return { ...b, items }
  })
  emitUpdate(arr)
}

function addListItem(blockIdx, afterIdx) {
  const arr = blocks.value.map((b, i) => {
    if (i !== blockIdx) return b
    const items = [...normalizeItems(b.items)]
    items.splice(afterIdx + 1, 0, { text: '', indent: items[afterIdx]?.indent || 0 })
    return { ...b, items }
  })
  emitUpdate(arr)
}

function onListBackspace(e, blockIdx, itemIdx) {
  const items = normalizeItems(blocks.value[blockIdx].items)
  if (e.target.value === '' && items.length > 1) {
    e.preventDefault()
    const arr = blocks.value.map((b, i) => {
      if (i !== blockIdx) return b
      return { ...b, items: normalizeItems(b.items).filter((_, li) => li !== itemIdx) }
    })
    emitUpdate(arr)
  }
}

function changeItemIndent(blockIdx, itemIdx, delta) {
  const arr = blocks.value.map((b, i) => {
    if (i !== blockIdx) return b
    const items = normalizeItems(b.items).map((it, li) => {
      if (li !== itemIdx) return it
      return { ...it, indent: Math.max(0, Math.min(4, (it.indent || 0) + delta)) }
    })
    return { ...b, items }
  })
  emitUpdate(arr)
}

function toggleDynamic(idx, checked) {
  if (checked) {
    updateBlock(idx, 'dataKey', '')
    // Set dataKey to empty string to show the fields
    const arr = blocks.value.map((b, i) => i === idx ? { ...b, dataKey: '', itemTemplate: '{{.}}' } : b)
    emitUpdate(arr)
  } else {
    const arr = blocks.value.map((b, i) => {
      if (i !== idx) return b
      const { dataKey, itemTemplate, ...rest } = b
      return { ...rest, items: rest.items?.length ? rest.items : [{ text: '', indent: 0 }] }
    })
    emitUpdate(arr)
  }
}

function getBlockTextStyle(block) {
  return {
    fontWeight: block.bold ? 'bold' : 'normal',
    fontStyle: block.italic ? 'italic' : 'normal',
    textAlign: block.align || 'left',
    color: block.color || '#e2e8f0',
  }
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
</script>

<style scoped>
.rich-editor { display: flex; flex-direction: column; gap: 6px; }

.re-toolbar { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
.re-select {
  font-size: 11px; padding: 3px 6px; border: 1px solid #334155;
  border-radius: 5px; background: #1e293b; color: #94a3b8; cursor: pointer; outline: none;
  max-width: 100%;
}
.re-select:focus { border-color: #3b82f6; }

.re-blocks { display: flex; flex-direction: column; gap: 4px; }

.re-block {
  background: #1e293b; border: 1px solid #334155; border-radius: 6px;
  overflow: hidden; transition: border-color 0.15s;
}
.re-block:hover { border-color: #475569; }
.re-block:focus-within { border-color: #3b82f6; }

.re-block-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 4px 6px; background: #0f172a; border-bottom: 1px solid #1e293b; gap: 4px;
}
.re-block-badge {
  font-size: 10px; font-weight: 700; color: #64748b;
  background: #1e293b; padding: 1px 6px; border-radius: 3px;
  min-width: 20px; text-align: center; flex-shrink: 0;
}
.re-block-controls { display: flex; gap: 2px; align-items: center; flex-wrap: wrap; }

.re-btn-tiny {
  width: 22px; height: 22px; border: 1px solid #334155; border-radius: 4px;
  background: transparent; color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; transition: all 0.1s; flex-shrink: 0;
}
.re-btn-tiny:hover { background: #334155; color: #e2e8f0; }
.re-btn-tiny.active { background: #3b82f6; border-color: #3b82f6; color: white; }
.re-btn-tiny:disabled { opacity: 0.3; cursor: default; }
.re-btn-del { color: #f87171; }
.re-btn-del:hover { background: #7f1d1d; color: #fca5a5; }

.re-mini-select {
  font-size: 10px; padding: 1px 2px; border: 1px solid #334155;
  border-radius: 3px; background: #0f172a; color: #94a3b8;
  cursor: pointer; outline: none; height: 22px;
}
.re-color-tiny {
  width: 22px; height: 22px; border: 1px solid #334155; border-radius: 4px;
  padding: 0; cursor: pointer; background: transparent;
}

.re-block-body { padding: 6px 8px; }

.re-textarea {
  width: 100%; border: none; background: transparent; color: #e2e8f0;
  font-size: 12px; line-height: 1.5; resize: none; outline: none;
  font-family: inherit; min-height: 24px; overflow: hidden;
}
.re-textarea::placeholder { color: #475569; }
.re-h1 { font-size: 18px; font-weight: 700; }
.re-h2 { font-size: 15px; font-weight: 700; }
.re-h3 { font-size: 13px; font-weight: 600; }

/* List options row */
.re-list-options {
  display: flex; gap: 6px; align-items: center; margin-bottom: 6px;
  padding-bottom: 6px; border-bottom: 1px solid #1e293b;
}
.re-tiny-label { font-size: 10px; color: #64748b; white-space: nowrap; }
.re-num-input {
  width: 44px; font-size: 11px; padding: 2px 4px; border: 1px solid #334155;
  border-radius: 4px; background: #0f172a; color: #e2e8f0; outline: none;
}

/* List items */
.re-list-item { display: flex; align-items: flex-start; gap: 4px; margin-bottom: 2px; }
.re-item-indent-controls { display: flex; flex-direction: column; gap: 0; flex-shrink: 0; }
.re-btn-micro {
  width: 14px; height: 12px; border: none; background: transparent;
  color: #475569; cursor: pointer; font-size: 10px; line-height: 1;
  display: flex; align-items: center; justify-content: center; padding: 0;
}
.re-btn-micro:hover { color: #3b82f6; }
.re-list-marker {
  font-size: 12px; color: #64748b; min-width: 20px; text-align: right;
  padding-top: 2px; flex-shrink: 0; transition: padding-left 0.15s;
}
.re-list-input {
  flex: 1; border: none; background: transparent; color: #e2e8f0;
  font-size: 12px; line-height: 1.5; outline: none; font-family: inherit; padding: 1px 0;
}
.re-list-input::placeholder { color: #475569; }

.re-check-toggle {
  border: none; background: transparent; cursor: pointer;
  font-size: 16px; color: #475569; padding: 0 2px; flex-shrink: 0;
  transition: color 0.12s; line-height: 1;
}
.re-check-toggle:hover { color: #94a3b8; }
.re-check-toggle.checked { color: #3b82f6; }

.re-btn-add-item {
  font-size: 10px; color: #64748b; background: none; border: 1px dashed #334155;
  border-radius: 4px; padding: 2px 8px; cursor: pointer; margin-top: 2px; transition: all 0.15s;
}
.re-btn-add-item:hover { color: #3b82f6; border-color: #3b82f6; }

/* Dynamic binding section */
.re-dynamic-section {
  margin-bottom: 6px; padding: 4px 0;
  border-bottom: 1px solid #1e293b;
}
.re-dynamic-toggle { margin-bottom: 4px; }
.re-dynamic-toggle label {
  font-size: 10px; color: #94a3b8; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
}
.re-dynamic-toggle input[type="checkbox"] { accent-color: #3b82f6; }
.re-dynamic-fields { display: flex; flex-direction: column; gap: 4px; margin-top: 4px; }
.re-field-row { display: flex; align-items: center; gap: 6px; }
.re-text-input {
  flex: 1; font-size: 11px; padding: 3px 6px; border: 1px solid #334155;
  border-radius: 4px; background: #0f172a; color: #e2e8f0; outline: none;
  font-family: monospace;
}
.re-text-input:focus { border-color: #3b82f6; }

.re-hint-box {
  background: #0f172a; border: 1px solid #1e293b; border-radius: 6px;
  padding: 6px 8px; margin-top: 4px;
}
.re-hint-title { font-size: 10px; color: #64748b; font-weight: 600; margin-bottom: 4px; }
.re-hint-code {
  font-size: 9px; color: #86efac; background: transparent;
  margin: 0; white-space: pre-wrap; word-break: break-all; line-height: 1.5;
  font-family: monospace;
}

.re-empty {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 20px; color: #475569; cursor: pointer; border: 1px dashed #334155;
  border-radius: 6px; font-size: 12px; transition: all 0.15s;
}
.re-empty:hover { border-color: #3b82f6; color: #94a3b8; }
.re-empty i { font-size: 18px; }
</style>
