<template>
  <div class="tree-node">
    <div class="tree-row" :class="{ active: isActive }">
      <button class="tree-btn" @click="toggleOrSelect" :style="{ paddingLeft: `${depth * 16 + 10}px` }">
        
        <!-- Caret for expand/collapse (only if has children) -->
        <span class="expand-icon" @click.stop="isOpen = !isOpen" v-if="node.children && node.children.length > 0">
          <i class="bi" :class="isOpen ? 'bi-chevron-down' : 'bi-chevron-right'"></i>
        </span>
        <span class="expand-icon placeholder" v-else></span>

        <!-- Icon / Swatch depending on type -->
        <i v-if="node.type==='department'" class="bi bi-building me-2 text-muted"></i>
        <i v-else-if="node.type==='user'" class="bi bi-person-circle me-2 text-muted"></i>
        <span v-else-if="node.type==='category'" class="cat-swatch me-2" :style="{ background: node.color || '#94a3b8' }"></span>
        <i v-else-if="node.type==='uncategorized'" class="bi bi-inbox me-2 text-muted"></i>

        <span class="tree-label">{{ node.name }}</span>
        <span class="nav-badge">{{ node.count }}</span>
      </button>

      <!-- Category specific actions -->
      <div v-if="node.type === 'category' && canManage" class="tree-row-actions">
        <button class="icon-btn-xs" @click.stop="$emit('add-category', node)" title="Add Subcategory"><i class="bi bi-plus-lg"></i></button>
        <button class="icon-btn-xs" @click.stop="$emit('edit-category', node)" title="Rename"><i class="bi bi-pencil"></i></button>
        <button class="icon-btn-xs danger" @click.stop="$emit('delete-category', node)" title="Delete"><i class="bi bi-trash"></i></button>
      </div>
      
      <!-- User specific action: Add root category -->
      <div v-if="node.type === 'user' && canManage" class="tree-row-actions">
        <button class="icon-btn-xs" @click.stop="$emit('add-category', { ...node, isUserRoot: true })" title="Add Category"><i class="bi bi-folder-plus"></i></button>
      </div>
    </div>

    <!-- Children -->
    <div v-show="isOpen" v-if="node.children && node.children.length > 0" class="tree-children">
      <SidebarTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
        :selectedFilter="selectedFilter"
        :currentUserId="currentUserId"
        :isAdmin="isAdmin"
        :isGuest="isGuest"
        @select="$emit('select', $event)"
        @add-category="$emit('add-category', $event)"
        @edit-category="$emit('edit-category', $event)"
        @delete-category="$emit('delete-category', $event)"
      />
    </div>
  </div>
</template>

<script>
export default { name: 'SidebarTreeNode' }
</script>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  node: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  selectedFilter: { type: Object, required: true },
  currentUserId: { type: String, default: '' },
  isAdmin: { type: Boolean, default: false },
  isGuest: { type: Boolean, default: false },
})
const emit = defineEmits(['select', 'add-category', 'edit-category', 'delete-category'])

const isOpen = ref(false) // default collapsed

// Can manage this node if admin, or if the node belongs to the current user.
// Guests can never manage anything.
const canManage = computed(() => {
  if (props.isGuest) return false
  if (props.isAdmin) return true
  const nodeUserId = props.node.filter?.userId
  return nodeUserId && nodeUserId === props.currentUserId
})

const isActive = computed(() => {
  const f = props.selectedFilter
  const n = props.node.filter
  if (!n) return false
  
  const fKeys = Object.keys(f)
  const nKeys = Object.keys(n)
  
  // They must match exactly keys and values
  if (fKeys.length !== nKeys.length) return false
  return nKeys.every(key => f[key] === n[key])
})

function toggleOrSelect() {
  // Always emit selection
  emit('select', props.node.filter)
  // Toggle if it has children and is already selected, or just toggle manually
  if (props.node.children && props.node.children.length > 0) {
    if (isActive.value) {
      isOpen.value = !isOpen.value
    }
    // Removed: else { isOpen.value = true } 
    // to keep it collapsed until explicitly toggled or already active toggle
  }
}
</script>

<style scoped>
.tree-row { display:flex; align-items:center; border-radius:8px; margin-bottom:2px; position:relative; }
.tree-row:hover .tree-row-actions { opacity:1; background:linear-gradient(90deg, transparent, #e2e8f0 30%); }
.tree-row.active:hover .tree-row-actions { background:linear-gradient(90deg, transparent, #1e293b 30%); }

.tree-row.active .tree-btn { color:#e2e8f0; background:#1e293b; }
.tree-btn { flex:1; display:flex; align-items:center; padding:8px 10px; border:none; background:none; font-size:13px; color:#94a3b8; text-align:left; cursor:pointer; border-radius:8px; transition:all .14s; }
.tree-btn:hover { background:#1e293b; color:#cbd5e1; }

.expand-icon { width:16px; display:inline-flex; align-items:center; justify-content:center; color:#64748b; font-size:10px; margin-right:4px; font-weight:bold; cursor:pointer; }
.expand-icon:hover { color:#94a3b8; }
.expand-icon.placeholder { visibility:hidden; }

.tree-label { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cat-swatch { width:10px; height:10px; border-radius:50%; flex-shrink:0; display:inline-block; }

.tree-row-actions { display:flex; gap:2px; opacity:0; transition:opacity .15s; padding-right:4px; flex-shrink:0; position:absolute; right:0; top:50%; transform:translateY(-50%); padding-left:15px; }
.icon-btn-xs { width:22px; height:22px; border:none; background:none; border-radius:5px; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all .12s; }
.icon-btn-xs:hover { background:#cbd5e1; color:#0f172a; }
.tree-row.active .icon-btn-xs:hover { background:#334155; color:#e2e8f0; }

.icon-btn-xs.danger:hover { background:#fecaca !important; color:#b91c1c !important; }
.tree-row.active .icon-btn-xs.danger:hover { background:#7f1d1d !important; color:#fca5a5 !important; }

.nav-badge { margin-left:auto; font-size:11px; background:#e2e8f0; color:#475569; border-radius:20px; padding:1px 8px; min-width:22px; text-align:center; }
.tree-row.active .nav-badge { background:#1a56db30; color:#93c5fd; }
.tree-row:not(.active) .tree-btn:hover .nav-badge { background:#334155; color:#94a3b8; }
</style>
