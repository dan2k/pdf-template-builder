<template>
  <div
    class="page-canvas"
    :style="canvasStyle"
    @click.self="onCanvasClick"
    @mousedown.self="onCanvasMousedown"
  >
    <!-- Marquee selection box -->
    <div
      v-if="marquee.active"
      class="marquee-rect"
      :style="{
        left:   marquee.left + 'px',
        top:    marquee.top  + 'px',
        width:  marquee.w    + 'px',
        height: marquee.h    + 'px',
      }"
    ></div>
    <!-- Margin guides -->
    <div class="margin-guide top" :style="{ top: page.config.marginTop + 'px' }"></div>
    <div class="margin-guide bottom" :style="{ bottom: page.config.marginBottom + 'px' }"></div>
    <div class="margin-guide left" :style="{ left: page.config.marginLeft + 'px' }"></div>
    <div class="margin-guide right" :style="{ right: page.config.marginRight + 'px' }"></div>

    <!-- Header zone visual -->
    <div v-if="effectiveHeader" class="hf-zone header-zone"
      :style="getHFStyle(effectiveHeader)">
      <span class="hf-zone-label">{{ globalHF?.applyToAllPages ? 'HEADER (Global)' : 'HEADER' }}</span>
      <div v-for="hel in (effectiveHeader.elements||[])" :key="hel.id"
        :style="{ position:'absolute', left:hel.x+'px', top:hel.y+'px', width:hel.width+'px', height:hel.height+'px', overflow:'hidden' }">
        <div v-if="hel.type==='text'"
          :style="{ fontSize:(hel.fontSize||10)+'px', color:hel.color||'#333', fontWeight:hel.fontWeight||'normal', fontStyle:hel.fontStyle||'normal', textAlign:hel.align||'left', lineHeight:1.4, overflow:'hidden', height:'100%' }">{{ hel.content }}</div>
        <div v-else-if="hel.type==='shape'" :style="getHFShapeStyle(hel)"></div>
        <img v-else-if="hel.type==='image' && hel.src" :src="hel.src"
          :style="{ width:'100%', height:'100%', objectFit: hel.objectFit||'contain' }" />
      </div>
    </div>

    <!-- Elements -->
    <div
      v-for="el in sortedElements"
      :key="el.id"
      class="canvas-element"
      :class="{ selected: el.id === selectedId, 'multi-selected': selectedIds.includes(el.id) && el.id !== selectedId }"
      :style="getElementStyle(el)"
      @mousedown.stop="startDrag($event, el)"
      @click.stop="onElementClick($event, el)"
      @dblclick.stop="startEdit(el)"
    >
      <!-- Text element -->
      <template v-if="el.type === 'text'">
        <textarea
          v-if="editingId === el.id"
          class="inline-edit"
          :value="el.content"
          @input="$emit('update-element', el.id, { content: $event.target.value })"
          @blur="stopEdit"
          @click.stop
          ref="editInput"
          :style="getTextStyle(el)"
        ></textarea>
        <div v-else class="text-content" :style="getTextStyle(el)">{{ el.content }}</div>
      </template>

      <!-- Image element -->
      <template v-else-if="el.type === 'image'">
        <div class="image-placeholder" v-if="!el.src && !el.bindingKey">
          <i class="bi bi-image"></i>
          <span>No Image</span>
        </div>
        <div class="image-placeholder binding-img" v-else-if="!el.src && el.bindingKey">
          <i class="bi bi-link-45deg"></i>
          <span>{{ el.bindingKey }}</span>
          <small>base64 variable</small>
        </div>
        <img v-else :src="getImageSrc(el.src)" :style="{ width: '100%', height: '100%', objectFit: el.objectFit || 'contain' }" @error="handleImgError($event)" />
      </template>

      <!-- Table element -->
      <template v-else-if="el.type === 'table'">
        <div class="table-wrapper" :style="{ width: '100%', height: '100%', overflow: 'hidden' }">
          <table class="preview-table" style="width:100%;border-collapse:collapse;font-size:inherit">
            <thead>
              <tr>
                <th v-for="col in el.columns" :key="col.key"
                  :style="{
                    background:  el.headerBgColor  || '#1a56db',
                    color:       el.headerTextColor || '#ffffff',
                    padding:     (el.headerPadding ?? el.cellPadding ?? 6) + 'px',
                    fontSize:    (el.headerFontSize || el.fontSize || 11) + 'px',
                    fontWeight:  el.headerFontWeight || 'bold',
                    textAlign:   col.headerAlign || el.headerAlign || col.align || 'left',
                    fontFamily:  getCssFontFamily(el.headerFontFamily || el.fontFamily),
                    border:      `${el.borderWidth || 1}px solid ${el.borderColor || '#e5e7eb'}`,
                    whiteSpace:  'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  }">
                  {{ col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="i in 3" :key="i">
                <td v-for="col in el.columns" :key="col.key"
                  :style="{
                    background:  i % 2 === 0 && el.altRowBgColor ? el.altRowBgColor : (el.rowBgColor || '#ffffff'),
                    color:       el.rowTextColor || '#111827',
                    padding:     (el.cellPadding || 6) + 'px',
                    fontSize:    (col.fontSize || el.fontSize || 11) + 'px',
                    fontWeight:  col.fontWeight || el.bodyFontWeight || 'normal',
                    textAlign:   col.align || el.bodyAlign || 'left',
                    fontFamily:  getCssFontFamily(el.fontFamily),
                    border:      `${el.innerBorderWidth ?? el.borderWidth ?? 1}px solid ${el.innerBorderColor || el.borderColor || '#e5e7eb'}`,
                    overflow: 'hidden', textOverflow: 'ellipsis',
                  }">
                  &#123;&#123;{{ col.key }}&#125;&#125;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="el.repeatHeaderOnNewPage" class="repeat-badge" title="Repeat header on new page">
          <i class="bi bi-arrow-repeat"></i>
        </div>
      </template>

      <!-- Shape element -->
      <template v-else-if="el.type === 'shape'">
        <svg :width="el.width" :height="el.height" style="overflow:visible;display:block">
          <rect v-if="el.shape === 'rectangle'"
            x="0" y="0" :width="el.width" :height="el.height"
            :rx="el.borderRadius || 0"
            :fill="el.fillColor || 'transparent'"
            :stroke="el.strokeColor || 'transparent'"
            :stroke-width="el.strokeWidth || 1" />
          <ellipse v-else-if="el.shape === 'circle'"
            :cx="el.width/2" :cy="el.height/2"
            :rx="el.width/2" :ry="el.height/2"
            :fill="el.fillColor || 'transparent'"
            :stroke="el.strokeColor || 'transparent'"
            :stroke-width="el.strokeWidth || 1" />
          <line v-else-if="el.shape === 'line'"
            x1="0" y1="0" :x2="el.width" :y2="el.height"
            :stroke="el.strokeColor || '#000'"
            :stroke-width="el.strokeWidth || 1" />
        </svg>
      </template>

      <!-- Divider element -->
      <!-- Group element: render children relative to group origin -->
      <template v-else-if="el.type === 'group'">
        <div
          v-for="child in el.children"
          :key="child.id"
          :style="{
            position: 'absolute',
            left:   child.x + 'px',
            top:    child.y + 'px',
            width:  child.width  + 'px',
            height: child.height + 'px',
            pointerEvents: 'none',
          }"
        >
          <!-- text child -->
          <div v-if="child.type === 'text'"
            :style="{
              fontSize:   (child.fontSize||12)+'px',
              fontFamily: getCssFontFamily(child.fontFamily),
              fontWeight: child.fontWeight||'normal',
              fontStyle:  child.fontStyle||'normal',
              color:      child.color||'#111',
              textAlign:  child.align||'left',
              lineHeight: child.lineHeight||1.4,
              padding:    (child.padding||0)+'px',
              background: child.backgroundColor||'transparent',
              width: '100%', height: '100%', overflow: 'hidden',
            }">{{ child.content }}</div>
          <!-- shape child -->
          <svg v-else-if="child.type === 'shape'" :width="child.width" :height="child.height" style="display:block">
            <rect v-if="child.shape==='rectangle'" x="0" y="0" :width="child.width" :height="child.height"
              :rx="child.borderRadius||0" :fill="child.fillColor||'#dbeafe'" :stroke="child.strokeColor||'#1a56db'" :stroke-width="child.strokeWidth||1"/>
            <circle v-else-if="child.shape==='circle'" :cx="child.width/2" :cy="child.height/2" :r="Math.min(child.width,child.height)/2-1"
              :fill="child.fillColor||'#dbeafe'" :stroke="child.strokeColor||'#1a56db'" :stroke-width="child.strokeWidth||1"/>
            <line v-else-if="child.shape==='line'" x1="0" :y1="child.height/2" :x2="child.width" :y2="child.height/2"
              :stroke="child.strokeColor||'#1a56db'" :stroke-width="child.strokeWidth||1"/>
          </svg>
          <!-- image child -->
          <img v-else-if="child.type==='image' && child.src" :src="child.src"
            :style="{ width:'100%', height:'100%', objectFit: child.objectFit||'contain' }" />
          <!-- divider child -->
          <svg v-else-if="child.type==='divider'" :width="child.width" :height="child.height" style="display:block">
            <line x1="0" :y1="child.height/2" :x2="child.width" :y2="child.height/2"
              :stroke="child.color||'#ccc'" :stroke-width="child.thickness||1"
              :stroke-dasharray="child.style==='dashed'?'8,4':child.style==='dotted'?'2,4':''" />
          </svg>
        </div>
        <!-- Group bounding box overlay -->
        <div style="position:absolute;inset:0;border:1px dashed rgba(26,86,219,0.35);border-radius:2px;pointer-events:none"></div>
      </template>

      <!-- Group element: render children relative to group origin -->
      <template v-else-if="el.type === 'group'">
        <div
          v-for="child in el.children"
          :key="child.id"
          :style="{
            position: 'absolute',
            left:   child.x + 'px',
            top:    child.y + 'px',
            width:  child.width  + 'px',
            height: child.height + 'px',
            pointerEvents: 'none',
          }"
        >
          <div v-if="child.type === 'text'"
            :style="{
              fontSize:   (child.fontSize||12)+'px',
              fontFamily: getCssFontFamily(child.fontFamily),
              fontWeight: child.fontWeight||'normal',
              fontStyle:  child.fontStyle||'normal',
              color:      child.color||'#111',
              textAlign:  child.align||'left',
              lineHeight: child.lineHeight||1.4,
              padding:    (child.padding||0)+'px',
              background: child.backgroundColor||'transparent',
              width: '100%', height: '100%', overflow: 'hidden',
            }">{{ child.content }}</div>
          <svg v-else-if="child.type === 'shape'" :width="child.width" :height="child.height" style="display:block">
            <rect v-if="child.shape==='rectangle'" x="0" y="0" :width="child.width" :height="child.height"
              :rx="child.borderRadius||0" :fill="child.fillColor||'#dbeafe'" :stroke="child.strokeColor||'#1a56db'" :stroke-width="child.strokeWidth||1"/>
            <circle v-else-if="child.shape==='circle'" :cx="child.width/2" :cy="child.height/2" :r="Math.min(child.width,child.height)/2-1"
              :fill="child.fillColor||'#dbeafe'" :stroke="child.strokeColor||'#1a56db'" :stroke-width="child.strokeWidth||1"/>
            <line v-else-if="child.shape==='line'" x1="0" :y1="child.height/2" :x2="child.width" :y2="child.height/2"
              :stroke="child.strokeColor||'#1a56db'" :stroke-width="child.strokeWidth||1"/>
          </svg>
          <img v-else-if="child.type==='image' && child.src" :src="child.src"
            :style="{ width:'100%', height:'100%', objectFit: child.objectFit||'contain' }" />
          <svg v-else-if="child.type==='divider'" :width="child.width" :height="child.height" style="display:block">
            <line x1="0" :y1="child.height/2" :x2="child.width" :y2="child.height/2"
              :stroke="child.color||'#ccc'" :stroke-width="child.thickness||1"
              :stroke-dasharray="child.style==='dashed'?'8,4':child.style==='dotted'?'2,4':''" />
          </svg>
        </div>
        <div style="position:absolute;inset:0;border:1px dashed rgba(26,86,219,0.35);border-radius:2px;pointer-events:none"></div>
      </template>

      <template v-else-if="el.type === 'divider'">
        <svg :width="el.width" :height="el.height" style="display:block;overflow:visible">
          <!-- solid / dashed / dotted -->
          <template v-if="el.style !== 'double'">
            <line
              x1="0" :y1="el.height/2" :x2="el.width" :y2="el.height/2"
              :stroke="el.color || '#d1d5db'"
              :stroke-width="el.thickness || 1"
              :stroke-linecap="el.lineCap || 'butt'"
              :stroke-dasharray="
                el.style === 'dashed' ? ((el.dash||6) + ',' + (el.dashSpace||4)) :
                el.style === 'dotted' ? ((el.dash||2) + ',' + (el.dashSpace||3)) : 'none'
              " />
          </template>
          <!-- double: two parallel lines -->
          <template v-else>
            <line
              x1="0" :y1="el.height/2 - (el.thickness||1) - 1" :x2="el.width" :y2="el.height/2 - (el.thickness||1) - 1"
              :stroke="el.color || '#d1d5db'" :stroke-width="el.thickness || 1" />
            <line
              x1="0" :y1="el.height/2 + (el.thickness||1) + 1" :x2="el.width" :y2="el.height/2 + (el.thickness||1) + 1"
              :stroke="el.color || '#d1d5db'" :stroke-width="el.thickness || 1" />
          </template>
        </svg>
      </template>

      <!-- Resize handles when selected -->
      <template v-if="el.id === selectedId">
        <div class="resize-handle nw" @mousedown.stop="startResize($event, el, 'nw')"></div>
        <div class="resize-handle n" @mousedown.stop="startResize($event, el, 'n')"></div>
        <div class="resize-handle ne" @mousedown.stop="startResize($event, el, 'ne')"></div>
        <div class="resize-handle e" @mousedown.stop="startResize($event, el, 'e')"></div>
        <div class="resize-handle se" @mousedown.stop="startResize($event, el, 'se')"></div>
        <div class="resize-handle s" @mousedown.stop="startResize($event, el, 's')"></div>
        <div class="resize-handle sw" @mousedown.stop="startResize($event, el, 'sw')"></div>
        <div class="resize-handle w" @mousedown.stop="startResize($event, el, 'w')"></div>
      </template>
    </div>

    <!-- Footer zone visual -->
    <div v-if="effectiveFooter" class="hf-zone footer-zone"
      :style="getHFStyle(effectiveFooter)">
      <span class="hf-zone-label">{{ globalHF?.applyToAllPages ? 'FOOTER (Global)' : 'FOOTER' }}</span>
      <div v-for="fel in (effectiveFooter.elements||[])" :key="fel.id"
        :style="{ position:'absolute', left:fel.x+'px', top:fel.y+'px', width:fel.width+'px', height:fel.height+'px', overflow:'hidden' }">
        <div v-if="fel.type==='text'"
          :style="{ fontSize:(fel.fontSize||10)+'px', color:fel.color||'#333', fontWeight:fel.fontWeight||'normal', fontStyle:fel.fontStyle||'normal', textAlign:fel.align||'left', lineHeight:1.4, overflow:'hidden', height:'100%' }">{{ fel.content }}</div>
        <div v-else-if="fel.type==='shape'" :style="getHFShapeStyle(fel)"></div>
        <img v-else-if="fel.type==='image' && fel.src" :src="fel.src"
          :style="{ width:'100%', height:'100%', objectFit: fel.objectFit||'contain' }" />
      </div>
      <!-- Page number preview -->
      <div v-if="effectivePageNumber" class="pn-preview-dot" :class="'pn-'+effectivePageNumber.position"
        :style="{ fontSize:(effectivePageNumber.fontSize||10)+'px', color:effectivePageNumber.color||'#666' }">
        {{ pnPreview }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, nextTick, watch } from 'vue'

const props = defineProps({
  page:       Object,
  globalHF:   Object,
  selectedId: String,
  selectedIds: { type: Array, default: () => [] },
  zoom:       Number,
})

// Resolve which header/footer/pageNumber to actually display
// Priority: globalHF (when applyToAllPages) > per-page
const effectiveHeader = computed(() => {
  if (props.globalHF?.applyToAllPages && props.globalHF.header?.enabled) return props.globalHF.header
  if (props.page?.header?.enabled) return props.page.header
  return null
})
const effectiveFooter = computed(() => {
  if (props.globalHF?.applyToAllPages && props.globalHF.footer?.enabled) return props.globalHF.footer
  if (props.page?.footer?.enabled) return props.page.footer
  return null
})
const effectivePageNumber = computed(() => {
  if (props.globalHF?.applyToAllPages && props.globalHF.pageNumber?.enabled) return props.globalHF.pageNumber
  if (props.page?.pageNumber?.enabled) return props.page.pageNumber
  return null
})

const fontFamilyMap = {
  'Helvetica': 'Helvetica, Arial, sans-serif',
  'Times-Roman': '"Times New Roman", Times, serif',
  'Courier': '"Courier New", Courier, monospace',
  'Sarabun': 'Sarabun, sans-serif',
  'Kanit': 'Kanit, sans-serif',
  'Prompt': 'Prompt, sans-serif',
  'Mitr': 'Mitr, sans-serif',
  'NotoSansThai': '"Noto Sans Thai", sans-serif',
  'ChakraPetch': '"Chakra Petch", sans-serif',
  'Trirong': 'Trirong, serif',
  'IBMPlexSansThai': '"IBM Plex Sans Thai", sans-serif',
  'Roboto': 'Roboto, sans-serif',
  'OpenSans': '"Open Sans", sans-serif',
  'Lato': 'Lato, sans-serif',
}

function getCssFontFamily(key) {
  return fontFamilyMap[key] || key || 'sans-serif'
}

const emit = defineEmits(['select', 'select-multi', 'update-element', 'update-element-done'])

const editingId = ref(null)
const editInput = ref(null)

// ── Marquee selection state ───────────────────────────────────────────────────
const marquee = ref({ active: false, startX: 0, startY: 0, left: 0, top: 0, w: 0, h: 0 })

// ── Canvas event handlers ─────────────────────────────────────────────────────
function onCanvasClick() {
  if (!marquee.value.active) {
    emit('select', null)
    emit('select-multi', [])
  }
}

function onCanvasMousedown(e) {
  if (e.button !== 0) return
  startMarquee(e)
}

function onElementClick(e, el) {
  if (e.shiftKey) {
    const ids = [...props.selectedIds]
    const idx = ids.indexOf(el.id)
    if (idx === -1) ids.push(el.id)
    else ids.splice(idx, 1)
    emit('select-multi', ids)
    emit('select', ids[ids.length - 1] || null)
  } else {
    emit('select', el.id)
    emit('select-multi', [])
  }
}

function startMarquee(e) {
  const rect = e.currentTarget.getBoundingClientRect()
  const z    = props.zoom || 1
  const sx   = (e.clientX - rect.left) / z
  const sy   = (e.clientY - rect.top)  / z
  marquee.value = { active: false, startX: sx, startY: sy, left: sx, top: sy, w: 0, h: 0 }

  const onMove = (me) => {
    const mx = (me.clientX - rect.left) / z
    const my = (me.clientY - rect.top)  / z
    const dx = mx - sx, dy = my - sy
    if (!marquee.value.active && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      marquee.value.active = true
    }
    if (marquee.value.active) {
      marquee.value.left = Math.min(sx, mx)
      marquee.value.top  = Math.min(sy, my)
      marquee.value.w    = Math.abs(dx)
      marquee.value.h    = Math.abs(dy)
    }
  }

  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup',   onUp)
    if (marquee.value.active) finishMarquee()
    setTimeout(() => { marquee.value.active = false }, 50)
  }

  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup',   onUp)
}

function finishMarquee() {
  const { left, top, w, h } = marquee.value
  if (w < 4 || h < 4) return
  const r = { x1: left, y1: top, x2: left + w, y2: top + h }
  const els = props.page?.elements || []
  const hit = els.filter(el => {
    const ex2 = el.x + (el.width  || 0)
    const ey2 = el.y + (el.height || 0)
    return el.x < r.x2 && ex2 > r.x1 && el.y < r.y2 && ey2 > r.y1
  })
  if (hit.length > 0) {
    emit('select-multi', hit.map(e => e.id))
    emit('select', hit[hit.length - 1].id)
  } else {
    emit('select', null)
    emit('select-multi', [])
  }
}

const PAGE_SIZES = { A4: [595.28, 841.89], A3: [841.89, 1190.55], Letter: [612, 792], Legal: [612, 1008] }

const dimensions = computed(() => {
  const cfg = props.page.config
  let [w, h] = PAGE_SIZES[cfg.size] || PAGE_SIZES.A4
  if (cfg.size === 'custom' && cfg.width && cfg.height) { w = cfg.width; h = cfg.height }
  if (cfg.orientation === 'landscape') return { w: h, h: w }
  return { w, h }
})

const canvasStyle = computed(() => ({
  width: dimensions.value.w + 'px',
  height: dimensions.value.h + 'px',
  background: props.page.config.backgroundColor || '#ffffff',
  position: 'relative',
  boxShadow: '0 4px 24px rgba(0,0,0,.18)',
  userSelect: 'none',
  overflow: 'hidden',
}))

function getHFStyle(zone) {
  return {
    height: (zone.height || 60) + 'px',
    background: zone.backgroundColor && zone.backgroundColor !== 'transparent'
      ? zone.backgroundColor : 'rgba(99,102,241,0.04)',
  }
}

function getHFShapeStyle(el) {
  if (el.shape === 'line') {
    return { width:'100%', height:'100%',
      borderTop: (el.strokeWidth||1)+'px solid '+(el.strokeColor||'#ccc'),
      background: 'transparent' }
  }
  return {
    width:'100%', height:'100%',
    background: el.fillColor && el.fillColor!=='transparent' ? el.fillColor : 'transparent',
    border: el.strokeWidth ? (el.strokeWidth+'px solid '+(el.strokeColor||'#ccc')) : 'none',
    borderRadius: el.borderRadius ? el.borderRadius+'px' : '',
  }
}

const pnPreview = computed(() => {
  const fmt = effectivePageNumber.value?.format || '{page}'
  return fmt.replace('{page}', '1').replace('{total}', '?')
})

const sortedElements = computed(() =>
  [...(props.page.elements || [])].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0))
)

function getElementStyle(el) {
  return {
    position: 'absolute',
    left: el.x + 'px',
    top: el.y + 'px',
    width: el.width + 'px',
    height: el.height + 'px',
    cursor: 'move',
    outline: el.id === props.selectedId ? '2px solid #1a56db' : 'none',
    outlineOffset: '1px',
    zIndex: el.zIndex || 0,
    overflow: 'hidden',
    opacity: el.hidden ? 0.25 : 1,
  }
}

function getTextStyle(el) {
  const fontFamilyMap = {
    'Helvetica': 'Helvetica, Arial, sans-serif',
    'Times-Roman': '"Times New Roman", Times, serif',
    'Courier': '"Courier New", Courier, monospace',
    'Sarabun': 'Sarabun, sans-serif',
    'Kanit': 'Kanit, sans-serif',
    'Prompt': 'Prompt, sans-serif',
    'Mitr': 'Mitr, sans-serif',
    'NotoSansThai': '"Noto Sans Thai", sans-serif',
    'Roboto': 'Roboto, sans-serif',
    'OpenSans': '"Open Sans", sans-serif',
    'Lato': 'Lato, sans-serif',
  }
  const cssFontFamily = fontFamilyMap[el.fontFamily] || el.fontFamily || 'sans-serif'
  return {
    fontFamily: cssFontFamily,
    textDecoration: el.textDecoration && el.textDecoration !== 'none' ? el.textDecoration : undefined,
    paddingLeft: el.indent ? el.indent + 'px' : undefined,
    fontSize: (el.fontSize || 12) + 'px',
    fontWeight: el.fontWeight || 'normal',
    fontStyle: el.fontStyle || 'normal',
    color: el.color || '#000',
    textAlign: el.align || 'left',
    lineHeight: el.lineHeight || 1.4,
    padding: (el.padding || 4) + 'px',
    background: el.backgroundColor || 'transparent',
    border: el.borderColor ? `${el.borderWidth || 1}px solid ${el.borderColor}` : 'none',
    width: '100%',
    height: '100%',
    resize: 'none',
    boxSizing: 'border-box',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  }
}

function getImageSrc(src) {
  if (!src) return ''
  if (src.startsWith('data:')) return src
  if (src.startsWith('http'))  return src
  // Raw base64 (no data: prefix) — try to detect and wrap
  if (src.length > 100 && /^[A-Za-z0-9+/=]+$/.test(src.substring(0, 40))) {
    return 'data:image/png;base64,' + src
  }
  return `http://localhost:3000${src}`
}

function handleImgError(e) {
  e.target.style.display = 'none'
}

function startEdit(el) {
  if (el.type !== 'text') return
  editingId.value = el.id
  nextTick(() => {
    if (editInput.value) {
      const inp = Array.isArray(editInput.value) ? editInput.value[0] : editInput.value
      inp?.focus()
    }
  })
}

function stopEdit() {
  if (editingId.value) {
    emit('update-element-done', editingId.value, {})
    editingId.value = null
  }
}

// Drag
let dragState = null
function startDrag(e, el) {
  if (editingId.value) return
  const isMulti = props.selectedIds.length > 1 && props.selectedIds.includes(el.id)
  if (!isMulti) {
    emit('select', el.id)
    emit('select-multi', [])
  }
  const scale = props.zoom || 1
  const allEls = props.page?.elements || []
  const multiIds = isMulti ? [...props.selectedIds] : []
  const multiOrigins = {}
  for (const mid of multiIds) {
    const mel = allEls.find(x => x.id === mid)
    if (mel) multiOrigins[mid] = { x: mel.x, y: mel.y }
  }
  dragState = {
    elId: el.id,
    startX: el.x, startY: el.y,
    mouseX: e.clientX / scale,
    mouseY: e.clientY / scale,
    multiIds, multiOrigins,
  }
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e) {
  if (!dragState) return
  const scale = props.zoom || 1
  const dx = e.clientX / scale - dragState.mouseX
  const dy = e.clientY / scale - dragState.mouseY
  // Move all selected elements if multi-select
  if (dragState.multiIds && dragState.multiIds.length > 1) {
    for (const mid of dragState.multiIds) {
      const orig = dragState.multiOrigins[mid]
      if (orig) emit('update-element', mid, { x: Math.round(orig.x + dx), y: Math.round(orig.y + dy) })
    }
    return
  }
  emit('update-element', dragState.elId, {
    x: Math.max(0, dragState.startX + dx),
    y: Math.max(0, dragState.startY + dy),
  })
}

function onDragEnd() {
  if (dragState) {
    if (dragState.multiIds?.length > 1) {
    for (const mid of dragState.multiIds) emit('update-element-done', mid, {})
  } else {
    emit('update-element-done', dragState.elId, {})
  }
    dragState = null
  }
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

// Resize
let resizeState = null
function startResize(e, el, handle) {
  e.stopPropagation()
  const scale = props.zoom || 1
  resizeState = {
    elId: el.id,
    handle,
    startX: el.x, startY: el.y,
    startW: el.width, startH: el.height,
    mouseX: e.clientX / scale,
    mouseY: e.clientY / scale,
  }
  window.addEventListener('mousemove', onResizeMove)
  window.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e) {
  if (!resizeState) return
  const scale = props.zoom || 1
  const dx = e.clientX / scale - resizeState.mouseX
  const dy = e.clientY / scale - resizeState.mouseY
  const { handle, startX, startY, startW, startH } = resizeState
  let x = startX, y = startY, w = startW, h = startH

  if (handle.includes('e')) w = Math.max(20, startW + dx)
  if (handle.includes('w')) { w = Math.max(20, startW - dx); x = startX + startW - w }
  if (handle.includes('s')) h = Math.max(10, startH + dy)
  if (handle.includes('n')) { h = Math.max(10, startH - dy); y = startY + startH - h }

  emit('update-element', resizeState.elId, { x, y, width: w, height: h })
}

function onResizeEnd() {
  if (resizeState) {
    emit('update-element-done', resizeState.elId, {})
    resizeState = null
  }
  window.removeEventListener('mousemove', onResizeMove)
  window.removeEventListener('mouseup', onResizeEnd)
}
</script>


<style scoped>
.hf-zone {
  position: relative;
  width: 100%;
  flex-shrink: 0;
  border: 1px dashed rgba(59,130,246,0.4);
  box-sizing: border-box;
}
.header-zone { border-bottom: 2px solid rgba(59,130,246,0.3); }
.footer-zone { border-top: 2px solid rgba(59,130,246,0.3); margin-top: auto; }
.hf-zone-label {
  position: absolute; top: 2px; right: 6px;
  font-size: 9px; font-weight: 700; letter-spacing: .5px;
  color: rgba(59,130,246,0.6); pointer-events: none; z-index: 100;
}
.pn-preview-dot {
  position: absolute;
  background: rgba(255,255,255,0.9);
  padding: 1px 6px;
  border: 1px dashed #bbb;
  border-radius: 10px;
  white-space: nowrap;
  pointer-events: none;
  z-index: 5;
}
.pn-bottom-center { bottom: 4px; left: 50%; transform: translateX(-50%); }
.pn-bottom-right  { bottom: 4px; right: 8px; }
.pn-bottom-left   { bottom: 4px; left: 8px; }
.pn-top-center    { top: 4px; left: 50%; transform: translateX(-50%); }
.pn-top-right     { top: 4px; right: 8px; }
.pn-top-left      { top: 4px; left: 8px; }

.pn-badge {
  position: absolute; bottom: 4px; right: 10px;
  font-size: 10px; color: #888; background: rgba(255,255,255,0.8);
  padding: 1px 6px; border-radius: 10px; border: 1px solid #ddd;
}

.page-canvas {
  display: flex;
  flex-direction: column;
  position: relative;
  flex-shrink: 0;
}

.margin-guide {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
}
.margin-guide.top, .margin-guide.bottom {
  left: 0; right: 0; height: 1px;
  background: rgba(26,86,219,.25);
  border-top: 1px dashed rgba(26,86,219,.3);
}
.margin-guide.left, .margin-guide.right {
  top: 0; bottom: 0; width: 1px;
  background: rgba(26,86,219,.25);
  border-left: 1px dashed rgba(26,86,219,.3);
}

.marquee-rect {
  position: absolute;
  border: 1.5px dashed #1a56db;
  background: rgba(26, 86, 219, 0.06);
  pointer-events: none;
  z-index: 9999;
  border-radius: 2px;
}
.canvas-element.multi-selected {
  outline: 1.5px dashed #1a56db !important;
  outline-offset: 1px;
}
.canvas-element {
  position: absolute;
  box-sizing: border-box;
}
.canvas-element:hover:not(.selected) {
  outline: 1px dashed #9ca3af;
  outline-offset: 1px;
}

.text-content {
  overflow: hidden;
  white-space: pre-wrap;
  word-break: break-word;
  pointer-events: none;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.inline-edit {
  outline: none;
  border: none;
  overflow: auto;
  resize: none;
  box-sizing: border-box;
  width: 100%;
  height: 100%;
}

.image-placeholder {
  width: 100%; height: 100%;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 6px;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  color: #9ca3af;
  font-size: 12px;
}
.image-placeholder i { font-size: 24px; }

.table-wrapper { position: relative; }

/* ── Marquee selection box ─────────────────────────────────────── */
.marquee-rect {
  position: absolute;
  border: 1.5px dashed #1a56db;
  background: rgba(26, 86, 219, 0.06);
  pointer-events: none;
  z-index: 9999;
  border-radius: 2px;
}

/* ── Multi-selected element highlight ──────────────────────────── */
.el-multi-selected {
  outline: 1.5px dashed #1a56db !important;
  outline-offset: 1px;
}

.repeat-badge {
  position: absolute;
  top: 4px; right: 4px;
  background: #10b981;
  color: white;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 10px;
}

/* Resize handles */
.resize-handle {
  position: absolute;
  width: 8px; height: 8px;
  background: white;
  border: 2px solid #1a56db;
  border-radius: 50%;
  z-index: 200;
}
.resize-handle.nw { top: -4px; left: -4px; cursor: nw-resize; }
.resize-handle.n { top: -4px; left: calc(50% - 4px); cursor: n-resize; }
.resize-handle.ne { top: -4px; right: -4px; cursor: ne-resize; }
.resize-handle.e { top: calc(50% - 4px); right: -4px; cursor: e-resize; }
.resize-handle.se { bottom: -4px; right: -4px; cursor: se-resize; }
.resize-handle.s { bottom: -4px; left: calc(50% - 4px); cursor: s-resize; }
.resize-handle.sw { bottom: -4px; left: -4px; cursor: sw-resize; }
.resize-handle.w { top: calc(50% - 4px); left: -4px; cursor: w-resize; }
</style>