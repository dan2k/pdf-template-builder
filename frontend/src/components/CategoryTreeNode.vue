<template>
  <div class="cat-node">
    <div class="cat-row" :class="{ active: selectedCat === category.name }">
      <button class="cat-btn" @click="$emit('select', category.name)" :style="{ paddingLeft: `${depth * 16 + 10}px` }">
        <span class="cat-swatch" :style="{ background: category.color }"></span>
        <span class="cat-label">{{ category.name }}</span>
        <span class="nav-badge">{{ getTemplateCount(category.name) }}</span>
      </button>
      <div class="cat-row-actions">
        <button class="icon-btn-xs" @click.stop="$emit('add-child', category)" title="Add Subcategory"><i class="bi bi-plus-lg"></i></button>
        <button class="icon-btn-xs" @click.stop="$emit('edit', category)" title="Rename"><i class="bi bi-pencil"></i></button>
        <button class="icon-btn-xs danger" @click.stop="$emit('delete', category)" title="Delete"><i class="bi bi-trash"></i></button>
      </div>
    </div>
    <div v-if="category.children && category.children.length > 0" class="cat-children">
      <CategoryTreeNode
        v-for="child in category.children"
        :key="child.id"
        :category="child"
        :depth="depth + 1"
        :selectedCat="selectedCat"
        :getTemplateCount="getTemplateCount"
        @select="$emit('select', $event)"
        @add-child="$emit('add-child', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script>
// We need to export a name for recursive components in Vue 3 sometimes, 
// though script setup usually handles it if the file name matches.
export default {
  name: 'CategoryTreeNode'
}
</script>

<script setup>
defineProps({
  category: { type: Object, required: true },
  depth: { type: Number, default: 0 },
  selectedCat: { type: String, required: true },
  getTemplateCount: { type: Function, required: true }
})
defineEmits(['select', 'add-child', 'edit', 'delete'])
</script>

<style scoped>
.cat-row { display:flex; align-items:center; border-radius:8px; margin-bottom:2px; position:relative; }
.cat-row:hover .cat-row-actions { opacity:1; }
.cat-row.active .cat-btn { color:#e2e8f0; background:#1e293b; }
.cat-btn { flex:1; display:flex; align-items:center; gap:8px; padding:8px 10px; border:none; background:none; font-size:13px; color:#94a3b8; text-align:left; cursor:pointer; border-radius:8px; transition:all .14s; }
.cat-btn:hover { background:#1e293b; color:#cbd5e1; }
.cat-label { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cat-swatch { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.cat-row-actions { display:flex; gap:2px; opacity:0; transition:opacity .15s; padding-right:4px; flex-shrink:0; position:absolute; right:0; top:50%; transform:translateY(-50%); background:linear-gradient(90deg, transparent, #0f172a 25%); padding-left:15px; }
.icon-btn-xs { width:22px; height:22px; border:none; background:none; border-radius:5px; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all .12s; }
.icon-btn-xs:hover { background:#334155; color:#e2e8f0; }
.icon-btn-xs.danger:hover { background:#7f1d1d; color:#fca5a5; }
.nav-badge { margin-left:auto; font-size:11px; background:#1e293b; color:#64748b; border-radius:20px; padding:1px 8px; min-width:22px; text-align:center; }
.cat-row.active .nav-badge { background:#1a56db30; color:#93c5fd; }
</style>
