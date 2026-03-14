<template>
  <div class="editor-layout">
    <!-- Top Bar -->
    <div class="editor-topbar">
      <div class="d-flex align-items-center gap-2">
        <router-link to="/" class="btn btn-sm btn-ghost">
          <i class="bi bi-arrow-left"></i>
        </router-link>
        <div class="logo-small"><i class="bi bi-file-earmark-pdf-fill text-primary"></i></div>
        <input
          v-if="store.template"
          v-model="store.template.name"
          class="template-name-input"
          @change="store.isDirty = true; store.saveMeta()"
        />
      </div>

      <div class="topbar-tools d-flex gap-1 align-items-center">
        <!-- Undo / Redo -->
        <button class="toolbar-btn" @click="store.undo()" title="Undo (Ctrl+Z)" :disabled="!canUndo"><i class="bi bi-arrow-counterclockwise"></i></button>
        <button class="toolbar-btn" @click="store.redo()" title="Redo (Ctrl+Y)" :disabled="!canRedo"><i class="bi bi-arrow-clockwise"></i></button>
        <div class="vr mx-1"></div>

        <!-- Select -->
        <button class="toolbar-btn" :class="{ active: activeTool === 'select' }" @click="activeTool = 'select'" title="Select (V)"><i class="bi bi-cursor"></i></button>
        <div class="vr mx-1"></div>

        <!-- ── TEXT group ── -->
        <div class="tb-group" ref="textGroupRef">
          <button class="toolbar-btn tb-main" @click="addTextElement" title="Add Text"><i class="bi bi-fonts"></i></button>
          <button class="toolbar-btn tb-caret" @click.stop="textMenuOpen=!textMenuOpen; shapeMenuOpen=false; layoutMenuOpen=false; mediaMenuOpen=false; tableMenuOpen=false"><i class="bi bi-chevron-down" style="font-size:8px"></i></button>
          <div v-if="textMenuOpen" class="tb-dropdown" @click.stop>
            <div class="tb-dd-header">Text</div>
            <button class="tb-dd-item" @click="addTextElement(); textMenuOpen=false"><i class="bi bi-fonts"></i>Text Box</button>
            <button class="tb-dd-item" @click="addHeadingElement(1); textMenuOpen=false"><i class="bi bi-type-h1"></i>Heading 1</button>
            <button class="tb-dd-item" @click="addHeadingElement(2); textMenuOpen=false"><i class="bi bi-type-h2"></i>Heading 2</button>
            <button class="tb-dd-item" @click="addHeadingElement(3); textMenuOpen=false"><i class="bi bi-type-h3"></i>Heading 3</button>
            <button class="tb-dd-item" @click="addLabelElement(); textMenuOpen=false"><i class="bi bi-tag"></i>Label / Caption</button>
            <button class="tb-dd-item" @click="addCodeElement(); textMenuOpen=false"><i class="bi bi-code"></i>Code Block</button>
          </div>
        </div>

        <!-- ── MEDIA group ── -->
        <div class="tb-group" ref="mediaGroupRef">
          <button class="toolbar-btn tb-main" @click="addImageElement" title="Add Image"><i class="bi bi-image"></i></button>
          <button class="toolbar-btn tb-caret" @click.stop="mediaMenuOpen=!mediaMenuOpen; textMenuOpen=false; shapeMenuOpen=false; layoutMenuOpen=false; tableMenuOpen=false"><i class="bi bi-chevron-down" style="font-size:8px"></i></button>
          <div v-if="mediaMenuOpen" class="tb-dropdown" @click.stop>
            <div class="tb-dd-header">Media</div>
            <button class="tb-dd-item" @click="addImageElement(); mediaMenuOpen=false"><i class="bi bi-image"></i>Image</button>
            <button class="tb-dd-item" @click="addBarcodeElement('qrcode'); mediaMenuOpen=false"><i class="bi bi-qr-code"></i>QR Code</button>
            <button class="tb-dd-item" @click="addBarcodeElement('barcode'); mediaMenuOpen=false"><i class="bi bi-upc"></i>Barcode</button>
          </div>
        </div>

        <!-- ── TABLE group ── -->
        <div class="tb-group" ref="tableGroupRef">
          <button class="toolbar-btn tb-main" @click="addTableElement" title="Add Table"><i class="bi bi-table"></i></button>
          <button class="toolbar-btn tb-caret" @click.stop="tableMenuOpen=!tableMenuOpen; textMenuOpen=false; shapeMenuOpen=false; layoutMenuOpen=false; mediaMenuOpen=false"><i class="bi bi-chevron-down" style="font-size:8px"></i></button>
          <div v-if="tableMenuOpen" class="tb-dropdown" @click.stop>
            <div class="tb-dd-header">Table</div>
            <button class="tb-dd-item" @click="addTableElement(); tableMenuOpen=false"><i class="bi bi-table"></i>Data Table</button>
            <button class="tb-dd-item" @click="addSimpleTableElement(); tableMenuOpen=false"><i class="bi bi-grid-3x3"></i>Simple Grid</button>
          </div>
        </div>

        <!-- ── SHAPE group ── -->
        <div class="tb-group" ref="shapeGroupRef">
          <button class="toolbar-btn tb-main" @click="addShapeElement" title="Add Shape"><i class="bi bi-square"></i></button>
          <button class="toolbar-btn tb-caret" @click.stop="shapeMenuOpen=!shapeMenuOpen; textMenuOpen=false; layoutMenuOpen=false; mediaMenuOpen=false; tableMenuOpen=false"><i class="bi bi-chevron-down" style="font-size:8px"></i></button>
          <div v-if="shapeMenuOpen" class="tb-dropdown" @click.stop>
            <div class="tb-dd-header">Shapes</div>
            <button class="tb-dd-item" @click="addShapeOf('rectangle'); shapeMenuOpen=false"><i class="bi bi-square"></i>Rectangle</button>
            <button class="tb-dd-item" @click="addShapeOf('circle'); shapeMenuOpen=false"><i class="bi bi-circle"></i>Circle / Ellipse</button>
            <button class="tb-dd-item" @click="addShapeOf('triangle'); shapeMenuOpen=false"><i class="bi bi-triangle"></i>Triangle</button>
            <button class="tb-dd-item" @click="addShapeOf('line'); shapeMenuOpen=false"><i class="bi bi-dash-lg"></i>Line</button>
            <div class="tb-dd-sep"></div>
            <div class="tb-dd-header">Dividers</div>
            <button class="tb-dd-item" @click="addDividerStyle('solid'); shapeMenuOpen=false"><i class="bi bi-dash-lg"></i>Solid Rule</button>
            <button class="tb-dd-item" @click="addDividerStyle('dashed'); shapeMenuOpen=false"><i class="bi bi-dash dash-dashed"></i>Dashed Rule</button>
            <button class="tb-dd-item" @click="addDividerStyle('dotted'); shapeMenuOpen=false"><i class="bi bi-dash dash-dotted"></i>Dotted Rule</button>
            <button class="tb-dd-item" @click="addDividerStyle('double'); shapeMenuOpen=false"><i class="bi bi-dash"></i>Double Rule</button>
          </div>
        </div>

        <!-- ── LAYOUT group ── -->
        <div class="tb-group" ref="layoutGroupRef">
          <button class="toolbar-btn tb-main" @click="layoutMenuOpen=!layoutMenuOpen; textMenuOpen=false; shapeMenuOpen=false; mediaMenuOpen=false; tableMenuOpen=false" title="Layout"><i class="bi bi-layout-three-columns"></i></button>
          <button class="toolbar-btn tb-caret" @click.stop="layoutMenuOpen=!layoutMenuOpen; textMenuOpen=false; shapeMenuOpen=false; mediaMenuOpen=false; tableMenuOpen=false"><i class="bi bi-chevron-down" style="font-size:8px"></i></button>
          <div v-if="layoutMenuOpen" class="tb-dropdown tb-dropdown-wide" @click.stop>
            <div class="tb-dd-header">Column Layouts</div>
            <div class="layout-grid">
              <button class="layout-chip" @click="addColumnLayout(1); layoutMenuOpen=false" title="1 Column">
                <div class="lc-preview lc-1"><div></div></div><span>1 Col</span>
              </button>
              <button class="layout-chip" @click="addColumnLayout(2); layoutMenuOpen=false" title="2 Columns">
                <div class="lc-preview lc-2"><div></div><div></div></div><span>2 Col</span>
              </button>
              <button class="layout-chip" @click="addColumnLayout(3); layoutMenuOpen=false" title="3 Columns">
                <div class="lc-preview lc-3"><div></div><div></div><div></div></div><span>3 Col</span>
              </button>
              <button class="layout-chip" @click="addColumnLayout(4); layoutMenuOpen=false" title="4 Columns">
                <div class="lc-preview lc-4"><div></div><div></div><div></div><div></div></div><span>4 Col</span>
              </button>
              <button class="layout-chip" @click="addLayoutPreset('sidebar-left'); layoutMenuOpen=false" title="Sidebar Left">
                <div class="lc-preview lc-sidebar-l"><div class="sm"></div><div class="lg"></div></div><span>◀ Side</span>
              </button>
              <button class="layout-chip" @click="addLayoutPreset('sidebar-right'); layoutMenuOpen=false" title="Sidebar Right">
                <div class="lc-preview lc-sidebar-r"><div class="lg"></div><div class="sm"></div></div><span>Side ▶</span>
              </button>
            </div>
            <div class="tb-dd-sep"></div>
            <div class="tb-dd-header">Content Blocks</div>
            <button class="tb-dd-item" @click="addContentBlock('card'); layoutMenuOpen=false"><i class="bi bi-card-text"></i>Card (Box + Text)</button>
            <button class="tb-dd-item" @click="addContentBlock('kv'); layoutMenuOpen=false"><i class="bi bi-list-columns"></i>Key-Value Row</button>
            <button class="tb-dd-item" @click="addContentBlock('banner'); layoutMenuOpen=false"><i class="bi bi-badge"></i>Banner / Header Block</button>
            <button class="tb-dd-item" @click="addContentBlock('invoice-header'); layoutMenuOpen=false"><i class="bi bi-receipt"></i>Invoice Header</button>
            <button class="tb-dd-item" @click="addContentBlock('signature'); layoutMenuOpen=false"><i class="bi bi-pen"></i>Signature Block</button>
          </div>
        </div>

        <div class="vr mx-1"></div>
        <div class="toolbar-right">
          <button class="toolbar-btn" @click="zoomOut" title="Zoom Out"><i class="bi bi-zoom-out"></i></button>
          <span class="zoom-label" style="cursor:pointer;user-select:none" @click="showSettings=!showSettings" title="Click to change settings">{{ Math.round(zoom * 100) }}%</span>
          <button class="toolbar-btn" @click="zoomIn" title="Zoom In"><i class="bi bi-zoom-in"></i></button>
          <div class="vr mx-1"></div>
          <button
            class="toolbar-btn"
            :disabled="store.selectedIds.length < 2"
            @click="store.groupElements(store.selectedIds)"
            title="Group (Ctrl+G)"
          ><i class="bi bi-collection"></i></button>
          <button
            class="toolbar-btn"
            :disabled="!isGroupSelected"
            @click="store.ungroupElement(store.selectedElementId)"
            title="Ungroup (Ctrl+Shift+G)"
          ><i class="bi bi-collection-fill"></i></button>
          <div class="vr mx-1"></div>
          <button class="toolbar-btn" :class="{active:showSettings}" @click="showSettings=!showSettings" title="Editor Settings"><i class="bi bi-gear"></i></button>
          <!-- Settings popover -->
          <div v-if="showSettings" class="settings-popover" @click.stop>
          <div class="settings-title"><i class="bi bi-gear me-1"></i>Editor Settings</div>
          <div class="settings-row">
            <label>Zoom step</label>
            <div class="settings-spin">
              <button @click="zoomStep = Math.max(1, zoomStep - 1)">−</button>
              <span>{{ zoomStep }}%</span>
              <button @click="zoomStep = Math.min(50, zoomStep + 1)">+</button>
            </div>
          </div>
          <div class="settings-row">
            <label>Arrow step (px)</label>
            <div class="settings-spin">
              <button @click="arrowStep = Math.max(1, arrowStep - 1)">−</button>
              <span>{{ arrowStep }}</span>
              <button @click="arrowStep = Math.min(50, arrowStep + 1)">+</button>
            </div>
          </div>
          <div class="settings-row">
            <label>Shift+Arrow (px)</label>
            <div class="settings-spin">
              <button @click="arrowStepLarge = Math.max(1, arrowStepLarge - 1)">−</button>
              <span>{{ arrowStepLarge }}</span>
              <button @click="arrowStepLarge = Math.min(100, arrowStepLarge + 1)">+</button>
            </div>
          </div>
        </div><!-- /.settings-popover -->
        </div><!-- /.toolbar-right -->
      </div>

      <div class="d-flex align-items-center gap-2">
        <span v-if="store.isDirty" class="badge bg-warning text-dark">Unsaved</span>
        <span v-else class="badge bg-success">Saved</span>
        
        <!-- AI Assistant Trigger -->
        <button class="btn btn-sm ai-sparkle-btn" @click="showAiPanel = !showAiPanel">
          <i class="bi bi-magic me-1"></i> AI Assistant
        </button>

        <button class="btn btn-sm btn-outline-secondary" @click="openPreview">
          <i class="bi bi-eye me-1"></i>Preview
        </button>
        <button class="btn btn-sm btn-primary" @click="save" :disabled="store.isSaving">
          <span v-if="store.isSaving" class="spinner-border spinner-border-sm me-1"></span>
          <i v-else class="bi bi-cloud-arrow-up me-1"></i>Save
        </button>
      </div>
    </div>

    <div class="editor-body">
      <!-- Left sidebar: pages panel -->
      <aside class="pages-sidebar">
        <div class="sidebar-header">
          <span>Pages</span>
          <button class="toolbar-btn" @click="store.addPage()" title="Add Page">
            <i class="bi bi-plus"></i>
          </button>
        </div>
        <div class="pages-list">
          <div
            v-for="(page, idx) in store.pages"
            :key="page.id"
            class="page-thumb-wrap"
            :class="{ active: idx === store.currentPageIndex }"
            @click="selectPage(idx)"
          >
            <div class="page-thumb-content" :style="getPageThumbStyle(page.config)">
              <div class="page-elem-preview" v-for="el in page.elements.slice(0, 5)" :key="el.id"
                :style="getElemPreviewStyle(el, page.config)"></div>
            </div>
            <div class="page-thumb-label">Page {{ idx + 1 }}</div>
            <div class="page-thumb-actions">
              <button @click.stop="store.duplicatePage(idx)" title="Duplicate"><i class="bi bi-copy"></i></button>
              <button @click.stop="store.removePage(idx)" title="Delete" :disabled="store.pages.length <= 1" class="text-danger"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>

      </aside>

      <!-- Main canvas area -->
      <main class="canvas-area" ref="canvasArea" @click.self="store.selectElement(null)">
        <div class="canvas-container-wrap">
        <div class="canvas-container" :style="{ transform: `scale(${zoom})`, transformOrigin: 'top center' }">
          <PageCanvas
            v-if="store.currentPage"
            :page="store.currentPage"
            :global-h-f="store.template?.globalHeaderFooter"
            :selected-id="store.selectedElementId"
            :selected-ids="store.selectedIds"
            :zoom="zoom"
            @select="store.selectElement"
            @select-multi="store.selectMulti"
            @update-element="store.updateElement"
            @update-element-done="store.updateElementAndHistory"
          />
        </div>
        </div><!-- end canvas-container-wrap -->
      </main>

      <!-- Right sidebar: properties panel -->
      <aside class="props-sidebar">
        <!-- Tab switcher -->
        <div class="sidebar-tabs">
          <button class="sidebar-tab" :class="{ active: rightTab === 'props' }" @click="rightTab = 'props'">
            <i class="bi bi-sliders me-1"></i>Properties
          </button>
          <button class="sidebar-tab" :class="{ active: rightTab === 'layers' }" @click="rightTab = 'layers'">
            <i class="bi bi-stack me-1"></i>Layers
            <span class="tab-badge">{{ store.currentPage?.elements?.length || 0 }}</span>
          </button>
          <button class="sidebar-tab" :class="{ active: rightTab === 'hf' }" @click="rightTab = 'hf'">
            <i class="bi bi-layout-text-window me-1"></i>H/F
          </button>
          <button class="sidebar-tab" :class="{ active: rightTab === 'info' }" @click="rightTab = 'info'">
            <i class="bi bi-tag me-1"></i>Info
          </button>
        </div>

        <!-- Properties tab -->
        <div v-if="rightTab === 'props'" class="sidebar-tab-content">
          <div v-if="store.selectedElement">
            <ElementProps
              :element="store.selectedElement"
              @update="onUpdateElement"
              @delete="store.removeElement(store.selectedElementId)"
              @duplicate="store.duplicateElement(store.selectedElementId)"
              @bring-forward="store.bringForward(store.selectedElementId)"
              @send-backward="store.sendBackward(store.selectedElementId)"
            />
          </div>
          <div v-else>
            <PageProps
              v-if="store.currentPage"
              :config="store.currentPage.config"
              @update="store.updatePageConfig"
            />
            <TemplateVariables
              v-if="store.template"
              :variables="store.template.variables || []"
              @update="store.template.variables = $event; store.isDirty = true"
            />
          </div>
        </div>

        <!-- Layers tab -->
        <div v-if="rightTab === 'layers'" class="sidebar-tab-content layers-tab-content">
          <LayersPanel
            :elements="store.currentPage?.elements || []"
            :selected-id="store.selectedElementId"
            @select="(id) => { store.selectElement(id); rightTab = 'props' }"
            @delete="store.removeElement"
            @toggle-visibility="toggleVisibility"
          />
        </div>

        <!-- Header / Footer / Page Number tab -->
        <div v-if="rightTab === 'hf'" class="sidebar-tab-content hf-tab-content">
          <HeaderFooterEditor
            v-if="store.currentPage"
            :page="store.currentPage"
            :global-h-f="store.template?.globalHeaderFooter"
            :page-index="store.currentPageIndex"
            @update="onUpdateHeaderFooter"
            @update-global="onUpdateGlobalHF"
          />
        </div>

        <!-- ── Info / Category / Tags tab ── -->
        <div v-if="rightTab === 'info'" class="sidebar-tab-content info-tab-content">
          <div class="info-section">
            <div class="info-section-title"><i class="bi bi-info-circle me-1"></i>Template Info</div>

            <!-- Description -->
            <label class="info-label">Description</label>
            <textarea
              v-model="store.template.description"
              class="info-textarea"
              placeholder="Short description of this template…"
              rows="3"
              @input="store.isDirty = true"
              @blur="store.saveMeta()"
            ></textarea>

              <!-- Category -->
              <label class="info-label mt-2">Category</label>
              <div class="cat-select-list-sidebar">
                <button
                  class="cat-select-item"
                  :class="{ sel: !store.template.category }"
                  @click="setCategory(null)"
                >
                  <i class="bi bi-slash-circle text-muted me-2"></i> None
                </button>
                <button
                  v-for="cat in editorCatTree"
                  :key="cat.id"
                  class="cat-select-item"
                  :class="{ sel: store.template.category === cat.name }"
                  :style="{ paddingLeft: (12 + cat.depth * 20) + 'px' }"
                  @click="setCategory(cat.name)"
                >
                  <span class="cat-dot-sm" :style="{ background: cat.color }"></span>
                  {{ cat.name }}
                </button>
                <button class="cat-add-btn" @click="showNewCatInline = !showNewCatInline">
                  <i class="bi bi-plus-lg"></i> New category
                </button>
              <!-- Inline new category form -->
              <div v-if="showNewCatInline" class="new-cat-form">
                <input
                  v-model="newCatName"
                  class="info-input"
                  placeholder="Category name"
                  @keydown.enter="createCategoryInline"
                  autofocus
                />
                <div class="color-dots-row">
                  <button
                    v-for="c in CAT_COLORS"
                    :key="c"
                    class="cdot"
                    :class="{ sel: newCatColor === c }"
                    :style="{ background: c }"
                    @click="newCatColor = c"
                  ></button>
                </div>
                <div class="new-cat-actions">
                  <button class="info-btn-ghost" @click="showNewCatInline = false; newCatName = ''">Cancel</button>
                  <button class="info-btn-primary" @click="createCategoryInline" :disabled="!newCatName.trim()">Create</button>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <label class="info-label mt-2">Tags</label>
            <div class="tags-input-wrap">
              <!-- current tags -->
              <div class="current-tags" v-if="(store.template.tags||[]).length">
                <span
                  v-for="tag in store.template.tags"
                  :key="tag"
                  class="cur-tag"
                >
                  #{{ tag }}
                  <button class="cur-tag-x" @click="removeTag(tag)">×</button>
                </span>
              </div>
              <!-- input -->
              <input
                v-model="tagInput"
                class="info-input"
                placeholder="Type tag + Enter"
                @keydown.enter.prevent="addTag"
                @keydown.comma.prevent="addTag"
              />
              <!-- existing tags from all templates -->
              <div v-if="allKnownTags.length" class="tag-suggestions">
                <span class="tag-sug-label">Quick add:</span>
                <button
                  v-for="tag in allKnownTags.filter(t => !(store.template.tags||[]).includes(t)).slice(0, 12)"
                  :key="tag"
                  class="tag-sug-chip"
                  @click="quickAddTag(tag)"
                >#{{ tag }}</button>
              </div>
            </div>

            <!-- Visibility -->
            <label class="info-label mt-3">Visibility</label>
            <select
              v-model="store.template.visibility"
              class="info-select"
              @change="store.saveMeta()"
            >
              <option value="private">Private (Only me)</option>
              <option value="public">Public (Anyone logged in)</option>
            </select>

            <!-- Allow Copy -->
            <div class="mt-3 d-flex align-items-center">
              <input
                type="checkbox"
                id="allowCopyEditor"
                v-model="store.template.allowCopy"
                class="form-check-input me-2 mt-0"
                @change="store.saveMeta()"
              >
              <label for="allowCopyEditor" class="info-label mb-0" style="cursor:pointer">Allow others to copy</label>
            </div>

            <!-- API Keys -->
            <div v-if="store.template?.id && (store.template.userId === authStore.user?.id || authStore.isAdmin)">
              <ApiKeyManager :templateId="store.template.id" />
            </div>

            <!-- Save reminder -->
            <div class="info-save-hint">
              <i class="bi bi-cloud-arrow-up me-1"></i>
              Press <kbd>Ctrl+S</kbd> to save changes
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Preview Modal -->
    <div class="modal fade" id="previewModal" tabindex="-1">
      <div class="modal-dialog modal-xl">
        <div class="modal-content">
          <div class="modal-header">
            <h6 class="modal-title">Preview PDF</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body p-0">
            <iframe v-if="previewUrl" :src="previewUrl" class="preview-iframe"></iframe>
          </div>
        </div>
      </div>
    </div>

    <!-- AI Assistant Panel -->
    <div v-if="showAiPanel" class="ai-panel">
      <div class="ai-header">
        <div class="ai-title"><i class="bi bi-magic me-1 text-primary"></i>AI Template Assistant</div>
        <button class="ai-close" @click="showAiPanel = false"><i class="bi bi-x"></i></button>
      </div>
      <div class="ai-body">
        <p class="ai-desc">Describe what you want to add or change on the current canvas.</p>
        <textarea
          v-model="aiPrompt"
          class="ai-input"
          rows="4"
          placeholder="e.g. Add a blue company header and a 4-column invoice table..."
          @keydown.enter.ctrl.prevent="runAi"
        ></textarea>
        <div class="ai-footer">
          <small class="text-muted">Press Ctrl+Enter to send</small>
          <button class="btn btn-primary btn-sm" @click="runAi" :disabled="aiLoading || !aiPrompt.trim()">
            <span v-if="aiLoading" class="spinner-border spinner-border-sm me-1"></span>
            <span v-else>Generate</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useEditorStore } from '../stores/editor'
import { templatesApi, generateApi, categoriesApi, aiApi } from '../api'

import { Modal } from 'bootstrap'
import PageCanvas from '../components/PageCanvas.vue'
import ElementProps from '../components/ElementProps.vue'
import PageProps from '../components/PageProps.vue'
import TemplateVariables from '../components/TemplateVariables.vue'
import LayersPanel from '../components/LayersPanel.vue'
import HeaderFooterEditor from '../components/HeaderFooterEditor.vue'
import ApiKeyManager from '../components/ApiKeyManager.vue'

// ── Category & Tags (Info tab) ────────────────────────────────────────────────
const CAT_COLORS = [
  '#1a56db','#0891b2','#10b981','#84cc16',
  '#f59e0b','#f97316','#ef4444','#ec4899',
  '#8b5cf6','#6366f1','#64748b','#1e293b',
]
let previewModal = null
const editorCategories = ref([])
const allKnownTags     = ref([])
const showNewCatInline = ref(false)
const newCatName       = ref('')
const newCatColor      = ref(CAT_COLORS[0])
const tagInput         = ref('')
const catSaving        = ref(false)

async function loadEditorMeta() {
  try {
    const [catsRes, tplsRes] = await Promise.all([
      categoriesApi.getAll(),
      templatesApi.getAll(),
    ])
    editorCategories.value = catsRes.data
    // Collect all known tags
    const set = new Set()
    tplsRes.data.forEach(t => (t.tags || []).forEach(g => set.add(g)))
    allKnownTags.value = [...set].sort()

    // If current template has a category string not yet in categories table → create it
    const curCat = store.template?.category
    if (curCat && !editorCategories.value.find(c => c.name === curCat)) {
      const res = await categoriesApi.create({ name: curCat, color: CAT_COLORS[0] })
      editorCategories.value.push(res.data)
    }
  } catch(e) { console.error('loadEditorMeta', e) }
}

async function setCategory(name) {
  const prev = store.template.category
  store.template.category = name || null
  store.isDirty = true
  // Auto-save to DB immediately — no need to press Ctrl+S
  try {
    await store.saveMeta()
  } catch(e) {
    store.template.category = prev  // rollback on error
    console.error('setCategory save failed', e)
  }
}

async function createCategoryInline() {
  const name = newCatName.value.trim()
  if (!name) return
  catSaving.value = true
  try {
    const res = await categoriesApi.create({ name, color: newCatColor.value })
    const cat = res.data
    if (!editorCategories.value.find(c => c.id === cat.id))
      editorCategories.value.push(cat)
    setCategory(cat.name)
  } catch(e) { console.error(e) }
  finally { catSaving.value = false }
  newCatName.value = ''
  showNewCatInline.value = false
}

async function saveMetaToDb() {
  await store.saveMeta()
}

function addTag() {
  const tag = tagInput.value.trim().replace(/^#/, '').replace(/[,;]$/, '').trim()
  if (!tag) return
  if (!store.template.tags) store.template.tags = []
  if (!store.template.tags.includes(tag)) {
    store.template.tags.push(tag)
    store.isDirty = true
    saveMetaToDb()
  }
  tagInput.value = ''
}

function removeTag(tag) {
  store.template.tags = (store.template.tags || []).filter(t => t !== tag)
  store.isDirty = true
  saveMetaToDb()
}

function quickAddTag(tag) {
  if (!store.template.tags) store.template.tags = []
  if (!store.template.tags.includes(tag)) {
    store.template.tags.push(tag)
    store.isDirty = true
    saveMetaToDb()
  }
}
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const store = useEditorStore()

const editorCatTree = computed(() => {
  const uId = store.template?.userId || authStore.user?.id
  const list = editorCategories.value.filter(c => c.userId === uId)
  const catMap = {}
  list.forEach(c => catMap[c.id] = { ...c, children: [] })
  const roots = []
  list.forEach(c => {
    if (c.parentId && catMap[c.parentId]) catMap[c.parentId].children.push(catMap[c.id])
    else roots.push(catMap[c.id])
  })
  
  const flattenTree = (nodes, depth = 0) => {
    return nodes.reduce((acc, n) => {
      acc.push({ ...n, depth })
      acc.push(...flattenTree(n.children, depth + 1))
      return acc
    }, [])
  }
  return flattenTree(roots)
})

const zoom         = ref(0.85)
const zoomStep     = ref(10)   // percent per click
const arrowStep    = ref(1)    // px per arrow key
const arrowStepLarge = ref(10) // px per Shift+arrow
const showSettings = ref(false)

// Close settings popover on outside click
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (showSettings.value && !e.target.closest('.settings-popover') && !e.target.closest('.toolbar-btn')) {
      showSettings.value = false
    }
  })
}
const activeTool   = ref('select')
const textMenuOpen  = ref(false)
const shapeMenuOpen = ref(false)
const mediaMenuOpen = ref(false)
const tableMenuOpen = ref(false)
const layoutMenuOpen = ref(false)

// Close all menus on outside click
function closeMenusOnOutside(e) {
  const t = e.target
  if (!t || !t.closest || !t.closest('.tb-group')) {
    textMenuOpen.value = false
    shapeMenuOpen.value = false
    mediaMenuOpen.value = false
    tableMenuOpen.value = false
    layoutMenuOpen.value = false
  }
}
onMounted(() => { window.addEventListener('click', closeMenusOnOutside) })
onUnmounted(() => { window.removeEventListener('click', closeMenusOnOutside) })
const previewUrl = ref('')
const canvasArea = ref(null)
const rightTab = ref('props')
const showAiPanel  = ref(false)
const aiPrompt     = ref('')
const aiLoading    = ref(false)

async function runAi() {
  console.log('runAi triggered', { prompt: aiPrompt.value, loading: aiLoading.value, hasPage: !!store.currentPage })
  if (!aiPrompt.value.trim() || aiLoading.value || !store.currentPage) {
    console.error('runAi aborted due to validation failure')
    return
  }
  
  aiLoading.value = true
  try {
    const rawElements = JSON.parse(JSON.stringify(store.currentPage.elements))
    const res = await aiApi.transform(aiPrompt.value, rawElements)
    console.log('AI API response:', res.data)
    
    if (res.data && res.data.elements) {
      store.currentPage.elements = res.data.elements
      
      store.history.splice(store.historyIndex + 1)
      store.history.push(JSON.stringify(store.pages))
      store.historyIndex = store.history.length - 1
      
      store.isDirty = true
      aiPrompt.value = ''
    }
  } catch (err) {
    console.error('AI Error:', err)
    alert('Failed to run AI: ' + (err.response?.data?.message || err.message))
  } finally {
    aiLoading.value = false
  }
}

const canUndo = computed(() => (store.historyIndex ?? 0) > 0)
const isGroupSelected = computed(() => {
  if (!store.selectedElementId) return false
  const el = store.currentPage?.elements?.find(e => e.id === store.selectedElementId)
  return el?.type === 'group'
})
const canRedo = computed(() => (store.historyIndex ?? 0) < (store.history?.length ?? 1) - 1)

function handleKeydown(e) {
  if (e.ctrlKey || e.metaKey) {
    if (e.key === 'z') { e.preventDefault(); store.undo() }
    if (e.key === 'y') { e.preventDefault(); store.redo() }
    if (e.key === 's') { e.preventDefault(); save() }
    if (e.key === 'd' && store.selectedElementId) { e.preventDefault(); store.duplicateElement(store.selectedElementId) }
    if (e.key === 'g' && !e.shiftKey && store.selectedIds.length >= 2) { e.preventDefault(); store.groupElements(store.selectedIds) }
    if (e.key === 'g' &&  e.shiftKey && isGroupSelected.value) { e.preventDefault(); store.ungroupElement(store.selectedElementId) }
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const focused = document.activeElement
    if (focused.tagName !== 'INPUT' && focused.tagName !== 'TEXTAREA' && store.selectedElementId) {
      store.removeElement(store.selectedElementId)
    }
  }
  if (e.key === 'Escape') store.selectElement(null)

  // Arrow keys — move selected element (1px normal, 10px with Shift)
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key) && store.selectedElementId) {
    const focused = document.activeElement
    if (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA' || focused.tagName === 'SELECT') return
    e.preventDefault()
    const step = e.shiftKey ? arrowStepLarge.value : arrowStep.value
    const el   = store.currentPage?.elements?.find(x => x.id === store.selectedElementId)
    if (!el) return
    const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0
    const dy = e.key === 'ArrowUp'   ? -step : e.key === 'ArrowDown'  ? step : 0
    // Move all multi-selected elements together with arrow keys
    const moveIds = store.selectedIds.length > 1 && store.selectedIds.includes(store.selectedElementId)
      ? store.selectedIds
      : [store.selectedElementId]
    for (const mid of moveIds) {
      const mel = store.currentPage?.elements?.find(x => x.id === mid)
      if (mel) store.updateElement(mid, { x: Math.round(mel.x + dx), y: Math.round(mel.y + dy) })
    }
    store.markDirty()
  }
}

onMounted(async () => {
  try {
    console.log('[EditorView] onMounted started')
    const modalEl = document.getElementById('previewModal')
    if (modalEl) {
      previewModal = new Modal(modalEl)
      console.log('[EditorView] previewModal initialized')
    } else {
      console.warn('[EditorView] previewModal element not found')
    }

    if (route.params.id) {
      try {
        console.log('[EditorView] fetching template', route.params.id)
        const res = await templatesApi.getOne(route.params.id)
        const tpl = res.data
        if (!tpl.tags) tpl.tags = []
        if (!tpl.category) tpl.category = null
        store.loadTemplate(tpl)
        console.log('[EditorView] template loaded')
      } catch (e) {
        console.error('[EditorView] error loading template params', e)
        store.initNew()
      }
    } else {
      console.log('[EditorView] route has no id, calling initNew()')
      store.initNew()
    }

    window.addEventListener('keydown', handleKeydown)
    console.log('[EditorView] keydown listener added')
    loadEditorMeta()
    console.log('[EditorView] onMounted finished successfully')
  } catch(err) {
    console.error('[EditorView] CRITICAL ERROR IN ONMOUNTED:', err)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function selectPage(idx) {
  store.currentPageIndex = idx
  store.selectedElementId = null
}

function zoomIn()  { zoom.value = Math.min(2,   Math.round((zoom.value + zoomStep.value / 100) * 100) / 100) }
function zoomOut() { zoom.value = Math.max(0.1, Math.round((zoom.value - zoomStep.value / 100) * 100) / 100) }

// Add elements with defaults
// ── Helpers ──────────────────────────────────────────────────────────────────
function getMargins() {
  const page = store.currentPage
  if (!page) return { ml: 40, mt: 40, mr: 40, mb: 40, cw: 515, ch: 762 }
  const ml = page.config.marginLeft  || 40
  const mt = page.config.marginTop   || 40
  const mr = page.config.marginRight || 40
  const mb = page.config.marginBottom|| 40
  const pw = (page.config.size === 'A3' ? 841.89 : 595.28)
  const cw = pw - ml - mr
  const ch = 841.89 - mt - mb
  return { ml, mt, mr, mb, cw, ch }
}

// ── Text variants ─────────────────────────────────────────────────────────────
function addHeadingElement(level) {
  const { ml, mt, cw } = getMargins()
  const sizes = { 1: 24, 2: 18, 3: 14 }
  store.addElement({
    type: 'text', x: ml, y: mt,
    width: cw, height: sizes[level] + 14,
    content: 'Heading ' + level,
    fontSize: sizes[level], fontFamily: 'Helvetica', fontWeight: 'bold',
    fontStyle: 'normal', color: level === 1 ? '#1a56db' : '#1f2937',
    align: 'left', lineHeight: 1.3, padding: 4,
    label: 'H' + level,
  })
}

function addLabelElement() {
  const { ml, mt, cw } = getMargins()
  store.addElement({
    type: 'text', x: ml, y: mt,
    width: 160, height: 22,
    content: 'Label',
    fontSize: 9, fontFamily: 'Helvetica', fontWeight: 'bold',
    fontStyle: 'normal', color: '#6b7280',
    align: 'left', lineHeight: 1.2, padding: 2,
    label: 'Label',
  })
}

function addCodeElement() {
  const { ml, mt, cw } = getMargins()
  store.addElement({
    type: 'text', x: ml, y: mt,
    width: cw, height: 60,
    content: '// code here',
    fontSize: 9, fontFamily: 'Courier', fontWeight: 'normal',
    fontStyle: 'normal', color: '#1e293b',
    align: 'left', lineHeight: 1.5, padding: 8,
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 4,
    label: 'Code Block',
  })
}

// ── Shape variants ────────────────────────────────────────────────────────────
function addShapeOf(shape) {
  const { ml, mt } = getMargins()
  const isLine = shape === 'line'
  const isCirc = shape === 'circle'
  store.addElement({
    type: 'shape', x: ml, y: mt,
    width:  isLine ? 400 : isCirc ? 80 : 120,
    height: isLine ? 2   : isCirc ? 80 : 80,
    shape,
    fillColor:   isLine ? 'transparent' : '#dbeafe',
    strokeColor: '#1a56db',
    strokeWidth: isLine ? 1.5 : 1.5,
    borderRadius: shape === 'rectangle' ? 6 : 0,
    label: shape.charAt(0).toUpperCase() + shape.slice(1),
  })
}

// ── Divider variants ──────────────────────────────────────────────────────────
function addDividerStyle(style) {
  const { ml, mt, cw } = getMargins()
  store.addElement({
    type: 'divider', x: ml, y: mt + 20,
    width: cw, height: 8,
    color: '#d1d5db', thickness: style === 'double' ? 3 : 1,
    style, dash: style === 'dashed' ? 6 : 2,
    dashSpace: style === 'dashed' ? 4 : 3,
    label: style.charAt(0).toUpperCase() + style.slice(1) + ' Rule',
  })
}

// ── Barcode / QR ──────────────────────────────────────────────────────────────
function addBarcodeElement(elType) {
  const { ml, mt } = getMargins()
  store.addElement({
    type: elType === 'qrcode' ? 'qrcode' : 'barcode',
    x: ml, y: mt,
    width: elType === 'qrcode' ? 80 : 200,
    height: elType === 'qrcode' ? 80 : 50,
    value: elType === 'qrcode' ? 'https://example.com' : '1234567890',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    showText: true,
    textPosition: 'bottom',
    label: elType === 'qrcode' ? 'QR Code' : 'Barcode',
  })
}

// ── Simple table ──────────────────────────────────────────────────────────────
function addSimpleTableElement() {
  const { ml, mt, cw } = getMargins()
  store.addElement({
    type: 'table',
    x: ml, y: mt,
    width: cw, height: 120,
    columns: [
      { key: 'col1', label: 'Column 1', width: 50 },
      { key: 'col2', label: 'Column 2', width: 50 },
    ],
    dataKey: 'rows',
    headerBgColor: '#f1f5f9', headerTextColor: '#374151',
    rowBgColor: '#ffffff', altRowBgColor: '#f8fafc',
    borderColor: '#e5e7eb', borderWidth: 1,
    fontSize: 10, cellPadding: 5,
    repeatHeaderOnNewPage: true,
    showHeader: true,
    label: 'Simple Grid',
  })
}

// ── Column layouts ────────────────────────────────────────────────────────────
function addColumnLayout(cols) {
  const { ml, mt, cw } = getMargins()
  const gap = 12
  const colW = Math.floor((cw - gap * (cols - 1)) / cols)
  const h = 120
  for (let i = 0; i < cols; i++) {
    const x = ml + i * (colW + gap)
    store.addElement({
      type: 'text',
      x, y: mt, width: colW, height: h,
      content: 'Column ' + (i + 1) + ' text',
      fontSize: 11, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#374151', align: 'left',
      lineHeight: 1.5, padding: 8,
      backgroundColor: '#f8fafc',
      borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 4,
      label: 'Col ' + (i + 1) + '/' + cols,
    })
  }
}

// ── Layout presets ────────────────────────────────────────────────────────────
function addLayoutPreset(preset) {
  const { ml, mt, cw } = getMargins()
  const gap = 12
  const h = 120
  if (preset === 'sidebar-left') {
    const sideW = Math.floor(cw * 0.3)
    const mainW = cw - sideW - gap
    store.addElement({ type: 'text', x: ml, y: mt, width: sideW, height: h,
      content: 'Sidebar', fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#374151', align: 'left', lineHeight: 1.5, padding: 8,
      backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 4,
      label: 'Sidebar' })
    store.addElement({ type: 'text', x: ml + sideW + gap, y: mt, width: mainW, height: h,
      content: 'Main content area', fontSize: 11, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#111827', align: 'left', lineHeight: 1.5, padding: 8,
      backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 4,
      label: 'Main' })
  } else if (preset === 'sidebar-right') {
    const sideW = Math.floor(cw * 0.3)
    const mainW = cw - sideW - gap
    store.addElement({ type: 'text', x: ml, y: mt, width: mainW, height: h,
      content: 'Main content area', fontSize: 11, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#111827', align: 'left', lineHeight: 1.5, padding: 8,
      backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderWidth: 1, borderRadius: 4,
      label: 'Main' })
    store.addElement({ type: 'text', x: ml + mainW + gap, y: mt, width: sideW, height: h,
      content: 'Sidebar', fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#374151', align: 'left', lineHeight: 1.5, padding: 8,
      backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1, borderRadius: 4,
      label: 'Sidebar' })
  }
}

// ── Content blocks ────────────────────────────────────────────────────────────
function addContentBlock(type) {
  const { ml, mt, cw } = getMargins()

  if (type === 'card') {
    store.addElement({ type: 'shape', x: ml, y: mt, width: cw, height: 100,
      shape: 'rectangle', fillColor: '#ffffff', strokeColor: '#e5e7eb',
      strokeWidth: 1, borderRadius: 8, label: 'Card BG' })
    store.addElement({ type: 'text', x: ml + 16, y: mt + 12, width: cw - 32, height: 76,
      content: 'Card content here', fontSize: 11, fontFamily: 'Helvetica',
      fontWeight: 'normal', fontStyle: 'normal', color: '#374151',
      align: 'left', lineHeight: 1.5, padding: 0, label: 'Card Text' })
  }
  else if (type === 'kv') {
    const labelW = 140, valW = cw - 144
    const rows = 3
    for (let i = 0; i < rows; i++) {
      const y = mt + i * 22
      store.addElement({ type: 'text', x: ml, y, width: labelW, height: 18,
        content: 'Label ' + (i + 1), fontSize: 9, fontFamily: 'Helvetica',
        fontWeight: 'bold', fontStyle: 'normal', color: '#6b7280',
        align: 'left', lineHeight: 1.2, padding: 0, label: 'KV Label ' + (i + 1) })
      store.addElement({ type: 'text', x: ml + labelW + 4, y, width: valW, height: 18,
        content: '{{value' + (i + 1) + '}}', fontSize: 10, fontFamily: 'Helvetica',
        fontWeight: 'normal', fontStyle: 'normal', color: '#111827',
        align: 'left', lineHeight: 1.2, padding: 0, label: 'KV Value ' + (i + 1) })
      if (i < rows - 1) store.addElement({ type: 'divider', x: ml, y: y + 19,
        width: cw, height: 4, color: '#f1f5f9', thickness: 1, style: 'solid' })
    }
  }
  else if (type === 'banner') {
    store.addElement({ type: 'shape', x: ml, y: mt, width: cw, height: 60,
      shape: 'rectangle', fillColor: '#1a56db', strokeColor: 'transparent',
      strokeWidth: 0, borderRadius: 6, label: 'Banner BG' })
    store.addElement({ type: 'text', x: ml + 20, y: mt + 8, width: cw - 40, height: 44,
      content: '{{companyName}}', fontSize: 20, fontFamily: 'Helvetica',
      fontWeight: 'bold', fontStyle: 'normal', color: '#ffffff',
      align: 'center', lineHeight: 1.2, padding: 0, label: 'Banner Title' })
  }
  else if (type === 'invoice-header') {
    // Company block (left)
    store.addElement({ type: 'text', x: ml, y: mt, width: 200, height: 80,
      content: '{{companyName}}\n{{companyAddress}}\n{{companyPhone}}',
      fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#374151', align: 'left', lineHeight: 1.6, padding: 0,
      label: 'Company Info' })
    // Invoice title (right)
    store.addElement({ type: 'text', x: ml + cw - 180, y: mt, width: 180, height: 32,
      content: 'INVOICE', fontSize: 22, fontFamily: 'Helvetica', fontWeight: 'bold',
      fontStyle: 'normal', color: '#1a56db', align: 'right', lineHeight: 1, padding: 0,
      label: 'Invoice Title' })
    store.addElement({ type: 'text', x: ml + cw - 180, y: mt + 36, width: 180, height: 44,
      content: 'No: {{invoiceNo}}\nDate: {{date}}',
      fontSize: 10, fontFamily: 'Helvetica', fontWeight: 'normal',
      fontStyle: 'normal', color: '#6b7280', align: 'right', lineHeight: 1.6, padding: 0,
      label: 'Invoice Meta' })
    // Divider below
    store.addElement({ type: 'divider', x: ml, y: mt + 90, width: cw, height: 6,
      color: '#1a56db', thickness: 2, style: 'solid', label: 'Invoice Rule' })
  }
  else if (type === 'signature') {
    const sigW = 180
    store.addElement({ type: 'divider', x: ml, y: mt + 40, width: sigW, height: 4,
      color: '#374151', thickness: 1, style: 'solid', label: 'Sig Line' })
    store.addElement({ type: 'text', x: ml, y: mt + 46, width: sigW, height: 16,
      content: 'Authorised Signature', fontSize: 8, fontFamily: 'Helvetica',
      fontWeight: 'normal', fontStyle: 'normal', color: '#9ca3af',
      align: 'center', lineHeight: 1, padding: 0, label: 'Sig Label' })
    store.addElement({ type: 'text', x: ml, y: mt + 62, width: sigW, height: 16,
      content: '{{signerName}}', fontSize: 9, fontFamily: 'Helvetica',
      fontWeight: 'bold', fontStyle: 'normal', color: '#374151',
      align: 'center', lineHeight: 1, padding: 0, label: 'Signer Name' })
  }
}

function addTextElement() {
  const page = store.currentPage
  if (!page) return
  const ml = page.config.marginLeft || 40
  const mt = page.config.marginTop || 40
  store.addElement({
    type: 'text',
    x: ml, y: mt,
    width: 300, height: 40,
    content: 'Double-click to edit text',
    fontSize: 14,
    fontFamily: 'Helvetica',
    fontWeight: 'normal',
    fontStyle: 'normal',
    color: '#111827',
    align: 'left',
    lineHeight: 1.4,
    padding: 4,
  })
}

function addImageElement() {
  const page = store.currentPage
  if (!page) return
  store.addElement({
    type: 'image',
    x: page.config.marginLeft || 40,
    y: page.config.marginTop || 40,
    width: 200, height: 150,
    src: '',
    objectFit: 'contain',
  })
}

function addTableElement() {
  const page = store.currentPage
  if (!page) return
  store.addElement({
    type: 'table',
    x: page.config.marginLeft || 40,
    y: page.config.marginTop || 40,
    width: 500, height: 200,
    columns: [
      { key: 'name', label: 'Name', width: 33 },
      { key: 'value', label: 'Value', width: 33 },
      { key: 'note', label: 'Note', width: 34 },
    ],
    dataKey: 'items',
    headerBgColor: '#1a56db',
    headerTextColor: '#ffffff',
    rowBgColor: '#ffffff',
    altRowBgColor: '#f3f4f6',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    fontSize: 11,
    cellPadding: 6,
    repeatHeaderOnNewPage: true,
  })
}

function addShapeElement() {
  const page = store.currentPage
  if (!page) return
  store.addElement({
    type: 'shape',
    x: page.config.marginLeft || 40,
    y: page.config.marginTop || 40,
    width: 120, height: 80,
    shape: 'rectangle',
    fillColor: '#e0f0ff',
    strokeColor: '#1a56db',
    strokeWidth: 2,
    borderRadius: 8,
  })
}

function addDividerElement() {
  const page = store.currentPage
  if (!page) return
  store.addElement({
    type: 'divider',
    x: page.config.marginLeft || 40,
    y: 200,
    width: 500, height: 10,
    color: '#d1d5db',
    thickness: 1,
    style: 'solid',
  })
}

function onUpdateElement(updates) {
  store.updateElementAndHistory(store.selectedElementId, updates)
}

function onUpdateHeaderFooter(patch) {
  const page = store.currentPage
  if (!page) return
  if (patch.header)     { page.header     = { ...(page.header     || {}), ...patch.header     } }
  if (patch.footer)     { page.footer     = { ...(page.footer     || {}), ...patch.footer     } }
  if (patch.pageNumber) { page.pageNumber = { ...(page.pageNumber || {}), ...patch.pageNumber } }
  store.isDirty = true
}

function onUpdateGlobalHF(patch) {
  if (!store.template) return
  store.template.globalHeaderFooter = {
    ...(store.template.globalHeaderFooter || {}),
    ...patch,
  }
  store.isDirty = true
}

function toggleVisibility(id) {
  const el = store.currentPage?.elements?.find(e => e.id === id)
  if (el) {
    store.updateElementAndHistory(id, { hidden: !el.hidden })
  }
}

async function save() {
  await store.save()
  if (!route.params.id && store.template?.id) {
    router.replace(`/editor/${store.template.id}`)
  }
}

async function openPreview() {
  if (!store.template?.id) {
    await save()
  }
  if (!store.template?.id) return

  try {
    const mockData = {}
    if (Array.isArray(store.template.variables)) {
      store.template.variables.forEach(v => {
        if (v.name) mockData[v.name] = v.defaultValue || ''
      })
    }
    const res = await generateApi.preview(store.template.id, mockData)
    const blob = new Blob([res.data], { type: 'application/pdf' })
    previewUrl.value = URL.createObjectURL(blob)
    previewModal?.show()
  } catch (e) {
    console.error(e)
    alert('Error generating preview: ' + e.message)
  }
}

function getPageThumbStyle(config) {
  const isLandscape = config.orientation === 'landscape'
  return {
    background: config.backgroundColor || '#fff',
    border: '1px solid #e5e7eb',
    width: isLandscape ? '90px' : '64px',
    height: isLandscape ? '45px' : '90px',
    position: 'relative',
    overflow: 'hidden',
  }
}

function getElemPreviewStyle(el, config) {
  const sizes = { A4: [595.28, 841.89], A3: [841.89, 1190.55], Letter: [612, 792] }
  let [pw, ph] = sizes[config.size] || sizes.A4
  if (config.orientation === 'landscape') [pw, ph] = [ph, pw]
  const isLandscape = config.orientation === 'landscape'
  const thumbW = isLandscape ? 90 : 64
  const thumbH = isLandscape ? 45 : 90
  const scaleX = thumbW / pw
  const scaleY = thumbH / ph
  const colors = { text: '#374151', image: '#bfdbfe', table: '#d1fae5', shape: '#fde68a', divider: '#e5e7eb' }
  return {
    position: 'absolute',
    left: `${el.x * scaleX}px`,
    top: `${el.y * scaleY}px`,
    width: `${el.width * scaleX}px`,
    height: `${Math.min(el.height * scaleY, 4)}px`,
    background: colors[el.type] || '#e5e7eb',
    borderRadius: '1px',
    minHeight: '2px',
  }
}
</script>

<style scoped>
.editor-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.editor-topbar {
  height: var(--header-height, 52px);
  background: white;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  flex-shrink: 0;
  box-shadow: var(--shadow-sm);
  z-index: 100;
  gap: 4px;
  overflow: visible;
}

.logo-small { font-size: 20px; }

.template-name-input {
  border: none;
  outline: none;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-800);
  background: transparent;
  padding: 4px 6px;
  border-radius: 6px;
  min-width: 80px;
  max-width: 160px;
  flex-shrink: 1;
}
.template-name-input:hover { background: var(--gray-100); }
.template-name-input:focus { background: var(--primary-light); }

.topbar-tools {
  flex: 1;
  justify-content: center;
  overflow: visible;
  min-width: 0;
  flex-wrap: nowrap;
  padding: 0 4px;
}
.topbar-tools::-webkit-scrollbar { display: none; }

/* ── Grouped toolbar buttons ── */
.tb-group {
  position: relative;
  display: flex;
  align-items: center;
}
.tb-main  { border-radius: 6px 0 0 6px !important; border-right: none !important; }
.tb-caret { border-radius: 0 6px 6px 0 !important; padding: 0 4px !important; min-width: 16px; border-left: 1px solid var(--gray-200) !important; }
.tb-caret:hover { background: var(--primary-light); }

.tb-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  min-width: 190px;
  background: white;
  border: 1px solid var(--gray-200);
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
  z-index: 9999;
  padding: 6px 0;
  animation: tbSlideIn .12s ease;
}
.tb-dropdown-wide { min-width: 240px; }
@keyframes tbSlideIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.tb-dd-header {
  padding: 4px 12px 2px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .6px;
  color: var(--gray-400);
}
.tb-dd-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 12px;
  border: none;
  background: transparent;
  font-size: 12px;
  color: var(--gray-700);
  cursor: pointer;
  transition: background .1s;
  text-align: left;
}
.tb-dd-item i { font-size: 14px; color: var(--gray-400); width: 16px; }
.tb-dd-item:hover { background: var(--gray-50); color: var(--primary); }
.tb-dd-item:hover i { color: var(--primary); }
.tb-dd-sep { height: 1px; background: var(--gray-100); margin: 4px 0; }

/* Column layout previews */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  padding: 6px 10px;
}
.layout-chip {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 6px 4px; border: 1px solid var(--gray-200); border-radius: 7px;
  background: white; cursor: pointer; font-size: 10px; color: var(--gray-500);
  transition: all .12s;
}
.layout-chip:hover { border-color: var(--primary); background: var(--primary-light); color: var(--primary); }
.lc-preview {
  display: flex; gap: 2px; width: 42px; height: 24px;
}
.lc-preview > div {
  flex: 1; background: var(--gray-200); border-radius: 2px;
}
.layout-chip:hover .lc-preview > div { background: var(--primary); opacity: .4; }
.lc-sidebar-l > div.sm { flex: 0 0 12px; }
.lc-sidebar-l > div.lg { flex: 1; }
.lc-sidebar-r > div.lg { flex: 1; }
.lc-sidebar-r > div.sm { flex: 0 0 12px; }

/* ── Settings popover ───────────────────────────────────────────── */
.settings-popover {
  position: fixed;
  top: var(--header-height, 52px);
  right: 8px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,.15);
  padding: 14px 16px;
  width: 230px;
  z-index: 99999;
  animation: slide-in 120ms ease;
}
.settings-title {
  font-size: 12px;
  font-weight: 700;
  color: #374151;
  margin-bottom: 12px;
  letter-spacing: .04em;
  text-transform: uppercase;
}
.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #4b5563;
}
.settings-row:last-child { margin-bottom: 0; }
.settings-row label { flex: 1; }
.settings-spin {
  display: flex;
  align-items: center;
  gap: 6px;
}
.settings-spin button {
  width: 22px; height: 22px;
  border: 1px solid #d1d5db;
  border-radius: 5px;
  background: #f9fafb;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background .12s;
}
.settings-spin button:hover { background: #e5e7eb; }
.settings-spin span {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
  color: #1a56db;
  font-size: 13px;
}
/* keep toolbar-btn parent positioned */
.toolbar-right {
  position: relative;
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

.zoom-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
  min-width: 38px;
  text-align: center;
}

.btn-ghost {
  background: transparent;
  border: none;
  color: var(--gray-600);
  padding: 4px 8px;
  border-radius: 6px;
}
.btn-ghost:hover { background: var(--gray-100); }

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Pages sidebar */
.pages-sidebar {
  width: 100px;
  background: var(--gray-900);
  border-right: 1px solid #2d3748;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .5px;
  color: #9ca3af;
  border-bottom: 1px solid #2d3748;
}

.sidebar-header .toolbar-btn {
  width: 22px; height: 22px;
  background: #374151;
  border-color: #4b5563;
  color: #9ca3af;
  font-size: 14px;
}
.sidebar-header .toolbar-btn:hover {
  background: var(--primary);
  border-color: var(--primary);
  color: white;
}

.pages-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-thumb-wrap {
  position: relative;
  cursor: pointer;
  border-radius: 4px;
  overflow: hidden;
  border: 2px solid transparent;
}
.page-thumb-wrap.active { border-color: var(--primary); }
.page-thumb-wrap:hover .page-thumb-actions { opacity: 1; }

.page-thumb-content {
  display: block;
  margin: 0 auto;
}

.page-elem-preview { pointer-events: none; }

.page-thumb-label {
  font-size: 9px;
  text-align: center;
  color: #9ca3af;
  padding: 2px 0;
}

.page-thumb-actions {
  position: absolute;
  top: 2px; right: 2px;
  display: flex; flex-direction: column; gap: 2px;
  opacity: 0;
  transition: opacity .2s;
}
.page-thumb-actions button {
  width: 18px; height: 18px;
  background: rgba(0,0,0,.7);
  border: none;
  border-radius: 3px;
  color: white;
  font-size: 9px;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  padding: 0;
}
.page-thumb-actions button:hover { background: var(--primary); }
.page-thumb-actions button.text-danger:hover { background: var(--danger); }
.page-thumb-actions button:disabled { opacity: .3; cursor: not-allowed; }

/* Canvas */
.canvas-area {
  flex: 1;
  overflow: auto;
  background: #e8ecf0;
  background-image: radial-gradient(circle, #b0b8c4 1px, transparent 1px);
  background-size: 20px 20px;
  padding: 40px 60px;
  display: flex;
  justify-content: center;
}

.canvas-container {
  flex-shrink: 0;
}

/* props-sidebar moved to new section */

.preview-iframe {
  width: 100%;
  height: 75vh;
  border: none;
}

/* Sidebar tabs */
.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50);
  flex-shrink: 0;
}
.sidebar-tab {
  flex: 1;
  padding: 8px 4px;
  border: none;
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  color: var(--gray-500);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all .15s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
}
.sidebar-tab:hover { color: var(--gray-800); background: var(--gray-100); }
.sidebar-tab.active { color: var(--primary); border-bottom-color: var(--primary); background: white; }

.tab-badge {
  background: var(--primary-light);
  color: var(--primary);
  border-radius: 10px;
  padding: 0 5px;
  font-size: 10px;
  font-weight: 700;
  min-width: 16px;
  text-align: center;
}

.sidebar-tab-content {
  overflow-y: auto;
  flex: 1;
}

.hf-tab-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.layers-tab-content {
  display: flex;
  flex-direction: column;
}

/* Props sidebar needs flex column */
.props-sidebar {
  width: var(--panel-width);
  background: white;
  border-left: 1px solid var(--gray-200);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}


/* ── Info tab ─────────────────────────────────────────────────── */
.info-tab-content { padding: 0; }
.info-section { padding: 14px 14px 20px; }
.info-section-title {
  font-size: 11px; font-weight: 700; color: var(--gray-500);
  text-transform: uppercase; letter-spacing: .06em;
  margin-bottom: 14px; padding-bottom: 8px;
  border-bottom: 1px solid var(--gray-100);
}
.info-label {
  display: block; font-size: 11.5px; font-weight: 600;
  color: var(--gray-600); margin-bottom: 5px;
}
.info-label.mt-2 { margin-top: 14px; }
.info-textarea {
  width: 100%; border: 1.5px solid var(--gray-200); border-radius: 8px;
  padding: 7px 10px; font-size: 12.5px; outline: none; resize: vertical;
  transition: border-color .15s; font-family: inherit; box-sizing: border-box;
}
.info-textarea:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.info-input {
  width: 100%; border: 1.5px solid var(--gray-200); border-radius: 8px;
  padding: 7px 10px; font-size: 12.5px; outline: none;
  transition: border-color .15s; box-sizing: border-box;
}
.info-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.info-select {
  width: 100%; border: 1.5px solid var(--gray-200); border-radius: 8px;
  padding: 7px 10px; font-size: 12.5px; outline: none;
  background: white; cursor: pointer;
  transition: border-color .15s; box-sizing: border-box;
}
.info-select:focus { border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }

/* Category select */
.cat-select-list-sidebar {
  display: flex; flex-direction: column; gap: 4px;
  max-height: 220px; overflow-y: auto;
  padding-right: 4px;
}
.cat-select-list-sidebar::-webkit-scrollbar { width: 4px; }
.cat-select-list-sidebar::-webkit-scrollbar-thumb { background: var(--gray-300); border-radius: 4px; }
.cat-select-wrap { display: flex; flex-direction: column; gap: 4px; }
.cat-select-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 10px; border-radius: 8px;
  border: 1.5px solid var(--gray-200); background: white;
  font-size: 12.5px; color: var(--gray-700);
  cursor: pointer; text-align: left; transition: all .12s;
}
.cat-select-item:hover { background: var(--gray-50); border-color: var(--gray-300); }
.cat-select-item.sel  { border-color: var(--primary); background: var(--primary-light); color: var(--primary); font-weight: 600; }
.cat-dot-sm { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.cat-add-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 10px; border-radius: 8px;
  border: 1.5px dashed var(--gray-300); background: transparent;
  font-size: 12px; color: var(--gray-500);
  cursor: pointer; transition: all .12s;
}
.cat-add-btn:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }
.new-cat-form {
  background: var(--gray-50); border-radius: 10px;
  border: 1.5px solid var(--gray-200);
  padding: 10px; display: flex; flex-direction: column; gap: 8px;
}
.color-dots-row { display: flex; gap: 6px; flex-wrap: wrap; }
.cdot {
  width: 22px; height: 22px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer; transition: transform .12s;
}
.cdot:hover { transform: scale(1.15); }
.cdot.sel { border-color: #1e293b; transform: scale(1.2); box-shadow: 0 0 0 2px white, 0 0 0 3px #1e293b; }
.new-cat-actions { display: flex; gap: 6px; justify-content: flex-end; }
.info-btn-ghost {
  border: 1.5px solid var(--gray-200); background: white; color: var(--gray-700);
  border-radius: 7px; padding: 5px 11px; font-size: 12px; cursor: pointer;
}
.info-btn-primary {
  background: var(--primary); color: white; border: none;
  border-radius: 7px; padding: 5px 11px; font-size: 12px; cursor: pointer;
}
.info-btn-primary:disabled { opacity: .5; cursor: not-allowed; }

/* Tags */
.tags-input-wrap { display: flex; flex-direction: column; gap: 7px; }
.current-tags { display: flex; flex-wrap: wrap; gap: 5px; }
.cur-tag {
  display: inline-flex; align-items: center; gap: 4px;
  background: #eff6ff; color: #1a56db;
  border: 1px solid #bfdbfe; border-radius: 20px;
  padding: 2px 8px 2px 10px; font-size: 12px; font-weight: 500;
}
.cur-tag-x {
  border: none; background: none; color: #93c5fd;
  cursor: pointer; font-size: 14px; line-height: 1;
  padding: 0; display: flex; align-items: center;
  transition: color .12s;
}
.cur-tag-x:hover { color: #1a56db; }
.tag-suggestions { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 2px; }
.tag-sug-label { font-size: 10.5px; color: var(--gray-400); flex-shrink: 0; }
.tag-sug-chip {
  border: 1px solid var(--gray-200); background: white; color: var(--gray-500);
  border-radius: 20px; padding: 2px 8px; font-size: 11px;
  cursor: pointer; transition: all .12s;
}
.tag-sug-chip:hover { border-color: var(--primary); color: var(--primary); background: var(--primary-light); }

.info-save-hint {
  margin-top: 18px; padding: 9px 12px;
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 8px; font-size: 11.5px; color: #16a34a;
  display: flex; align-items: center;
}
.info-save-hint kbd {
  background: #dcfce7; border: 1px solid #86efac;
  border-radius: 4px; padding: 1px 5px; font-size: 10.5px;
  font-family: monospace; margin: 0 2px;
}

/* AI Assistant Panel & Button */
.ai-sparkle-btn {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
  background-size: 200% 200%;
  color: #fff !important;
  border: none;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
  transition: all 0.3s ease;
  animation: bg-shift 4s ease infinite;
}
.ai-sparkle-btn:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
}
@keyframes bg-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.ai-panel {
  position: absolute;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  width: 480px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.2);
  border: 1px solid var(--primary, #0d6efd);
  z-index: 99999;
  overflow: hidden;
  animation: slide-down 0.2s ease-out;
}
@keyframes slide-down {
  from { opacity: 0; transform: translate(-50%, -10px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}
.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #e5e7eb;
}
.ai-title {
  font-weight: 700;
  font-size: 14px;
  color: #1f2937;
}
.ai-close {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  line-height: 1;
}
.ai-close:hover { color: #ef4444; }
.ai-body {
  padding: 16px;
  background: white;
}
.ai-settings {
  padding: 8px;
  background: #f1f5f9;
  border-radius: 8px;
  margin-bottom: 12px;
}
.ai-label-xs {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  color: #64748b;
  display: block;
  margin-bottom: 2px;
}
.form-select-xs {
  padding: 2px 4px;
  font-size: 11px;
  height: 28px;
}
.form-control-xs {
  padding: 2px 6px;
  font-size: 11px;
  height: 28px;
}
.ai-desc {
  font-size: 12px;
  color: #4b5563;
  margin-bottom: 10px;
}
.ai-input {
  width: 100%;
  border: 2px solid #bfdbfe;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  font-family: inherit;
  resize: none;
  outline: none;
  transition: border-color 0.15s;
}
.ai-input:focus { border-color: #3b82f6; }
.ai-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}
</style>