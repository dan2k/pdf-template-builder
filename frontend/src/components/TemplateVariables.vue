<template>
  <div>
    <div class="panel-section">
      <div class="d-flex align-items-center justify-content-between mb-2">
        <div class="panel-section-title mb-0">Variables</div>
        <button class="btn btn-xs btn-outline-primary" @click="addVariable">
          <i class="bi bi-plus"></i> Add
        </button>
      </div>
      <small class="text-muted d-block mb-2">Define variables for dynamic data binding</small>

      <div v-if="!localVars.length" class="text-center py-2 text-muted" style="font-size:12px">
        No variables defined
      </div>

      <div v-for="(v, i) in localVars" :key="i" class="var-item">
        <div class="d-flex gap-1 align-items-start">
          <div style="flex:1">
            <input type="text" class="form-control form-control-sm mb-1" v-model="v.name" placeholder="Variable name" @change="emitUpdate" />
            <select class="form-select form-select-sm mb-1" v-model="v.type" @change="emitUpdate">
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="array">Array (for table)</option>
            </select>
            <input type="text" class="form-control form-control-sm" v-model="v.defaultValue" placeholder="Default value" @change="emitUpdate" />
          </div>
          <button class="btn btn-xs btn-outline-danger mt-1" @click="removeVar(i)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({ variables: Array })
const emit = defineEmits(['update'])

const localVars = ref(props.variables ? JSON.parse(JSON.stringify(props.variables)) : [])

watch(() => props.variables, (v) => {
  if (v) localVars.value = JSON.parse(JSON.stringify(v))
}, { deep: true })

function addVariable() {
  localVars.value.push({ name: '', type: 'string', defaultValue: '', description: '' })
  emitUpdate()
}

function removeVar(i) {
  localVars.value.splice(i, 1)
  emitUpdate()
}

function emitUpdate() {
  emit('update', JSON.parse(JSON.stringify(localVars.value)))
}
</script>

<style scoped>
.var-item {
  background: var(--gray-50);
  border: 1px solid var(--gray-200);
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 6px;
}
.btn-xs { font-size: 11px; padding: 2px 6px; line-height: 1.5; }
</style>
