<template>
  <div>
    <div class="panel-section">
      <div class="panel-section-title">Page Settings</div>

      <div class="prop-row">
        <label class="prop-label">Size</label>
        <select class="form-select form-select-sm prop-control" :value="config.size" @change="update('size', $event.target.value)">
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="Letter">Letter</option>
          <option value="Legal">Legal</option>
          <option value="custom">Custom</option>
        </select>
      </div>

      <div v-if="config.size === 'custom'" class="prop-row">
        <label class="prop-label">Width (pt)</label>
        <input type="number" class="form-control form-control-sm prop-control" :value="config.width || 595" @change="update('width', +$event.target.value)" />
      </div>
      <div v-if="config.size === 'custom'" class="prop-row">
        <label class="prop-label">Height (pt)</label>
        <input type="number" class="form-control form-control-sm prop-control" :value="config.height || 842" @change="update('height', +$event.target.value)" />
      </div>

      <div class="prop-row">
        <label class="prop-label">Orientation</label>
        <div class="btn-group btn-group-sm prop-control">
          <button
            class="btn btn-outline-secondary"
            :class="{ active: config.orientation === 'portrait' }"
            @click="update('orientation', 'portrait')"
          ><i class="bi bi-file-earmark"></i> Portrait</button>
          <button
            class="btn btn-outline-secondary"
            :class="{ active: config.orientation === 'landscape' }"
            @click="update('orientation', 'landscape')"
          ><i class="bi bi-file-earmark-fill" style="transform:rotate(90deg);display:inline-block"></i> Landscape</button>
        </div>
      </div>

      <div class="prop-row">
        <label class="prop-label">Background</label>
        <div class="d-flex gap-2 align-items-center">
          <input type="color" class="color-swatch" :value="config.backgroundColor || '#ffffff'" @input="update('backgroundColor', $event.target.value)" />
          <input type="text" class="form-control form-control-sm" :value="config.backgroundColor || '#ffffff'" @change="update('backgroundColor', $event.target.value)" style="width:80px;font-size:11px;font-family:monospace" />
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-section-title">Margins (pt)</div>
      <div class="margin-grid">
        <div></div>
        <div>
          <input type="number" class="form-control form-control-sm text-center" :value="config.marginTop" @change="update('marginTop', +$event.target.value)" />
          <div class="margin-label">Top</div>
        </div>
        <div></div>
        <div>
          <input type="number" class="form-control form-control-sm text-center" :value="config.marginLeft" @change="update('marginLeft', +$event.target.value)" />
          <div class="margin-label">Left</div>
        </div>
        <div class="margin-center"><i class="bi bi-file-earmark text-muted"></i></div>
        <div>
          <input type="number" class="form-control form-control-sm text-center" :value="config.marginRight" @change="update('marginRight', +$event.target.value)" />
          <div class="margin-label">Right</div>
        </div>
        <div></div>
        <div>
          <input type="number" class="form-control form-control-sm text-center" :value="config.marginBottom" @change="update('marginBottom', +$event.target.value)" />
          <div class="margin-label">Bottom</div>
        </div>
        <div></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({ config: Object })
const emit = defineEmits(['update'])

function update(key, val) {
  emit('update', { [key]: val })
}
</script>

<style scoped>
.margin-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 4px;
  align-items: center;
  text-align: center;
}
.margin-grid input { font-size: 11px; }
.margin-label { font-size: 10px; color: var(--gray-500); margin-top: 2px; }
.margin-center { font-size: 24px; display: flex; align-items: center; justify-content: center; }
</style>
