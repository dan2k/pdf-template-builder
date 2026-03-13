<template>
  <div class="layers-panel">
    <div class="layers-header">
      <div class="d-flex align-items-center gap-2">
        <i class="bi bi-stack" style="font-size:13px;color:var(--gray-500)"></i>
        <span>Objects</span>
        <span class="layer-count">{{ elements.length }}</span>
      </div>
      <button class="layers-refresh" @click="$emit('refresh')" title="Refresh">
        <i class="bi bi-arrow-clockwise"></i>
      </button>
    </div>

    <div class="layers-list" v-if="elements.length">
      <div
        v-for="el in reversedElements"
        :key="el.id"
        class="layer-item"
        :class="{ selected: el.id === selectedId, hovered: hoveredId === el.id }"
        @click="$emit('select', el.id)"
        @mouseenter="hoveredId = el.id"
        @mouseleave="hoveredId = null"
      >
        <!-- Type icon -->
        <div class="layer-icon" :class="'layer-icon-' + el.type">
          <i :class="typeIcon(el)"></i>
        </div>

        <!-- Name / content preview -->
        <div class="layer-info">
          <div class="layer-name">{{ getElementLabel(el) }}</div>
          <div class="layer-sub">
            <span>{{ el.x | 0 }}, {{ el.y | 0 }}</span>
            <span>{{ el.width | 0 }} × {{ el.height | 0 }}</span>
          </div>
        </div>

        <!-- Visibility toggle -->
        <div class="layer-actions">
          <button
            class="layer-btn"
            :class="{ dimmed: el.hidden }"
            @click.stop="$emit('toggle-visibility', el.id)"
            :title="el.hidden ? 'Show' : 'Hide'"
          >
            <i :class="el.hidden ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
          </button>
          <button
            class="layer-btn"
            @click.stop="$emit('delete', el.id)"
            title="Delete"
            style="color:#ef4444"
          >
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>

    <div v-else class="layers-empty">
      <i class="bi bi-layers" style="font-size:24px;opacity:.3"></i>
      <div style="font-size:11px;color:var(--gray-400);margin-top:6px">No objects on this page</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  elements: { type: Array, default: () => [] },
  selectedId: String,
})
const emit = defineEmits(['select', 'delete', 'toggle-visibility', 'refresh'])

const hoveredId = ref(null)

const reversedElements = computed(() =>
  [...props.elements].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
)

function typeIcon(el) {
  return {
    text: 'bi bi-fonts',
    image: 'bi bi-image',
    table: 'bi bi-table',
    shape: 'bi bi-square',
    divider: 'bi bi-dash-lg',
  }[el.type] || 'bi bi-square'
}

function getElementLabel(el) {
  switch (el.type) {
    case 'text':
      return el.content?.slice(0, 22) || '(empty text)'
    case 'image':
      return el.src ? 'Image' : '(no image)'
    case 'table':
      return `Table: ${el.dataKey || '?'} (${(el.columns || []).length} cols)`
    case 'shape':
      return `${el.shape || 'Shape'}`
    case 'divider':
      return `Divider (${el.style || 'solid'})`
    default:
      return el.type
  }
}
</script>

<style scoped>
.layers-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.layers-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-700);
  border-bottom: 1px solid var(--gray-200);
  flex-shrink: 0;
}

.layer-count {
  background: var(--gray-200);
  color: var(--gray-600);
  border-radius: 10px;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 700;
}

.layers-refresh {
  width: 22px; height: 22px;
  border: none; background: transparent;
  border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--gray-400); font-size: 12px;
}
.layers-refresh:hover { background: var(--gray-100); color: var(--gray-600); }

.layers-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
  transition: background .1s;
  border: 1px solid transparent;
  margin-bottom: 2px;
}
.layer-item:hover { background: var(--gray-50); }
.layer-item.selected {
  background: var(--primary-light);
  border-color: rgba(26,86,219,.3);
}
.layer-item.hovered:not(.selected) { background: var(--gray-100); }

.layer-icon {
  width: 26px; height: 26px;
  border-radius: 5px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  flex-shrink: 0;
}
.layer-icon-text    { background: #dbeafe; color: #1d4ed8; }
.layer-icon-image   { background: #dcfce7; color: #16a34a; }
.layer-icon-table   { background: #fef9c3; color: #b45309; }
.layer-icon-shape   { background: #f3e8ff; color: #7c3aed; }
.layer-icon-divider { background: #fee2e2; color: #dc2626; }

.layer-info { flex: 1; min-width: 0; }

.layer-name {
  font-size: 12px;
  font-weight: 500;
  color: var(--gray-800);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.layer-sub {
  display: flex;
  gap: 6px;
  font-size: 10px;
  color: var(--gray-400);
  margin-top: 1px;
}

.layer-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity .15s;
}
.layer-item:hover .layer-actions,
.layer-item.selected .layer-actions { opacity: 1; }

.layer-btn {
  width: 22px; height: 22px;
  border: none; background: transparent;
  border-radius: 4px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px;
  color: var(--gray-500);
  transition: background .1s;
  padding: 0;
}
.layer-btn:hover { background: var(--gray-200); }
.layer-btn.dimmed { opacity: .4; }

.layers-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
}
</style>
