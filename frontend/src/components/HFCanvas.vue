<!-- Interactive canvas for Header / Footer element positioning with drag & drop -->
<template>
  <div class="hfc-wrap">
    <div
      class="hfc"
      ref="canvasRef"
      :style="canvasStyle"
      @mousedown.self="$emit('select', null)"
    >
      <!-- Background color -->
      <div v-if="config.backgroundColor && config.backgroundColor !== 'transparent'"
        class="hfc-bg" :style="{ background: config.backgroundColor }"></div>

      <!-- Elements -->
      <div
        v-for="el in elements" :key="el.id"
        class="hfc-el"
        :class="{ selected: el.id === selectedId }"
        :style="elStyle(el)"
        @mousedown.stop="startDrag($event, el)"
        @click.stop="$emit('select', el.id)"
      >
        <!-- Text preview -->
        <template v-if="el.type==='text'">
          <div class="hfc-text" :style="textStyle(el)">{{ el.content || '…' }}</div>
        </template>

        <!-- Image preview -->
        <template v-else-if="el.type==='image'">
          <img v-if="el.src" :src="el.src" :style="{ width:'100%', height:'100%', objectFit: el.objectFit||'contain' }" />
          <div v-else class="hfc-img-ph"><i class="bi bi-image"></i></div>
        </template>

        <!-- Shape preview -->
        <template v-else-if="el.type==='shape'">
          <div :style="shapeStyle(el)"></div>
        </template>

        <!-- Selected handles -->
        <template v-if="el.id === selectedId">
          <div class="hfc-handle nw" @mousedown.stop="startResize($event, el, 'nw')"></div>
          <div class="hfc-handle ne" @mousedown.stop="startResize($event, el, 'ne')"></div>
          <div class="hfc-handle sw" @mousedown.stop="startResize($event, el, 'sw')"></div>
          <div class="hfc-handle se" @mousedown.stop="startResize($event, el, 'se')"></div>
          <div class="hfc-handle n"  @mousedown.stop="startResize($event, el, 'n')"></div>
          <div class="hfc-handle s"  @mousedown.stop="startResize($event, el, 's')"></div>
          <div class="hfc-handle e"  @mousedown.stop="startResize($event, el, 'e')"></div>
          <div class="hfc-handle w"  @mousedown.stop="startResize($event, el, 'w')"></div>
        </template>
      </div>

      <!-- Zone label -->
      <div class="hfc-label">{{ zone.toUpperCase() }}</div>
    </div>

    <!-- Coordinate readout -->
    <div v-if="selectedEl" class="hfc-coords">
      x:{{ Math.round(selectedEl.x) }} &nbsp; y:{{ Math.round(selectedEl.y) }} &nbsp;
      w:{{ Math.round(selectedEl.width) }} &nbsp; h:{{ Math.round(selectedEl.height) }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  zone:       String,          // 'header' | 'footer'
  config:     Object,          // HeaderFooterConfig
  selectedId: { type: String, default: null },
})
const emit = defineEmits(['select', 'update-el'])

// Canvas is 260px wide → scale to represent the actual zone width (595pt A4)
const CANVAS_W   = 252   // px display width
const PDF_W      = 595   // pt A4 width
const SCALE      = CANVAS_W / PDF_W   // ~0.423

const canvasRef  = ref(null)

const elements = computed(() => props.config?.elements || [])
const zoneH    = computed(() => (props.config?.height || (props.zone === 'header' ? 60 : 40)) * SCALE)

const canvasStyle = computed(() => ({
  width:  CANVAS_W + 'px',
  height: zoneH.value + 'px',
  minHeight: '36px',
}))

const selectedEl = computed(() =>
  elements.value.find(e => e.id === props.selectedId) || null
)

function elStyle(el) {
  return {
    position: 'absolute',
    left:   (el.x * SCALE) + 'px',
    top:    (el.y * SCALE) + 'px',
    width:  (el.width  * SCALE) + 'px',
    height: (el.height * SCALE) + 'px',
    zIndex: el.zIndex || 0,
    cursor: 'move',
    boxSizing: 'border-box',
  }
}

function textStyle(el) {
  return {
    fontSize:   Math.max(6, (el.fontSize || 10) * SCALE) + 'px',
    color:      el.color || '#333',
    fontWeight: el.fontWeight || 'normal',
    fontStyle:  el.fontStyle  || 'normal',
    textAlign:  el.align || 'left',
    lineHeight: 1.3,
    overflow:   'hidden',
    width: '100%', height: '100%',
    whiteSpace: 'nowrap',
  }
}

function shapeStyle(el) {
  if (el.shape === 'line') {
    return {
      width: '100%', height: '100%',
      borderTop: (el.strokeWidth || 1) + 'px solid ' + (el.strokeColor || '#ccc'),
    }
  }
  return {
    width: '100%', height: '100%',
    background:   el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'transparent',
    border:       el.strokeWidth ? ((el.strokeWidth) + 'px solid ' + (el.strokeColor || '#ccc')) : 'none',
    borderRadius: el.borderRadius ? (el.borderRadius * SCALE) + 'px' : '',
  }
}

// ── Drag ──────────────────────────────────────────────────────────────────────
let dragState = null

function startDrag(e, el) {
  e.preventDefault()
  emit('select', el.id)
  dragState = {
    id: el.id,
    startX:  el.x, startY: el.y,
    mouseX:  e.clientX, mouseY: e.clientY,
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup',   onDragEnd)
}

function onDragMove(e) {
  if (!dragState) return
  const dx = (e.clientX - dragState.mouseX) / SCALE
  const dy = (e.clientY - dragState.mouseY) / SCALE
  emit('update-el', {
    id: dragState.id,
    patch: {
      x: Math.max(0, Math.round(dragState.startX + dx)),
      y: Math.max(0, Math.round(dragState.startY + dy)),
    },
  })
}

function onDragEnd() {
  dragState = null
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup',   onDragEnd)
}

// ── Resize ────────────────────────────────────────────────────────────────────
let resizeState = null

function startResize(e, el, handle) {
  e.preventDefault()
  resizeState = {
    id: el.id, handle,
    startX: el.x, startY: el.y,
    startW: el.width, startH: el.height,
    mouseX: e.clientX, mouseY: e.clientY,
  }
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup',   onResizeEnd)
}

function onResizeMove(e) {
  if (!resizeState) return
  const dx = (e.clientX - resizeState.mouseX) / SCALE
  const dy = (e.clientY - resizeState.mouseY) / SCALE
  const { handle, startX, startY, startW, startH } = resizeState
  let x = startX, y = startY, w = startW, h = startH

  if (handle.includes('e')) w = Math.max(20, startW + dx)
  if (handle.includes('w')) { w = Math.max(20, startW - dx); x = startX + startW - w }
  if (handle.includes('s')) h = Math.max(5,  startH + dy)
  if (handle.includes('n')) { h = Math.max(5, startH - dy); y = startY + startH - h }

  emit('update-el', {
    id: resizeState.id,
    patch: { x: Math.round(x), y: Math.round(y), width: Math.round(w), height: Math.round(h) },
  })
}

function onResizeEnd() {
  resizeState = null
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup',   onResizeEnd)
}
</script>

<style scoped>
.hfc-wrap { padding: 0 0 4px 0; }

.hfc {
  position: relative;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0,0,0,.08);
  margin: 0 auto;
  user-select: none;
}
.hfc:hover { border-color: #93c5fd; }

.hfc-bg { position: absolute; inset: 0; pointer-events: none; }

.hfc-label {
  position: absolute; top: 2px; right: 5px;
  font-size: 8px; font-weight: 700; letter-spacing: .5px;
  color: rgba(99,102,241,.4); pointer-events: none; z-index: 50;
}

/* Elements */
.hfc-el {
  position: absolute;
  border: 1px dashed transparent;
  transition: border-color .1s;
}
.hfc-el:hover    { border-color: rgba(99,102,241,.4); }
.hfc-el.selected { border-color: #4f46e5; border-style: solid; }

.hfc-text { pointer-events: none; }
.hfc-img-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: #f1f5f9; color: #94a3b8; font-size: 14px;
}

/* Resize handles */
.hfc-handle {
  position: absolute; width: 8px; height: 8px;
  background: white; border: 1.5px solid #4f46e5; border-radius: 2px;
  z-index: 10;
}
.hfc-handle.nw { top: -4px;  left: -4px;  cursor: nw-resize; }
.hfc-handle.ne { top: -4px;  right: -4px; cursor: ne-resize; }
.hfc-handle.sw { bottom: -4px; left: -4px;  cursor: sw-resize; }
.hfc-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
.hfc-handle.n  { top: -4px;  left: 50%; transform: translateX(-50%); cursor: n-resize; }
.hfc-handle.s  { bottom: -4px; left: 50%; transform: translateX(-50%); cursor: s-resize; }
.hfc-handle.e  { right: -4px; top: 50%; transform: translateY(-50%); cursor: e-resize; }
.hfc-handle.w  { left: -4px;  top: 50%; transform: translateY(-50%); cursor: w-resize; }

/* Coord readout */
.hfc-coords {
  font-size: 10px; color: var(--gray-400); font-family: monospace;
  text-align: center; padding: 2px 0;
}
</style>
