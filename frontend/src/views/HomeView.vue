<template>
  <div class="home-root">

    <!-- ══ SIDEBAR ════════════════════════════════════════════════ -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon"><i class="bi bi-file-earmark-pdf-fill"></i></div>
        <span class="logo-text">PDF Template Builder</span>
      </div>

      <nav class="sidebar-nav">
        <button class="nav-item" :class="{ active: Object.keys(selectedFilter).length === 0 }" @click="selectedFilter={}">
          <i class="bi bi-grid-2x2-fill nav-icon"></i>
          <span>All Templates</span>
          <span class="nav-badge">{{ templates.length }}</span>
        </button>
        <button class="nav-item" :class="{ active: selectedFilter.uncategorized && !selectedFilter.department }" @click="selectedFilter={uncategorized:true}">
          <i class="bi bi-inbox nav-icon"></i>
          <span>Uncategorized</span>
          <span class="nav-badge">{{ templates.filter(t=>!t.category).length }}</span>
        </button>
      </nav>

      <div class="sidebar-section-head">
        <span>{{ authStore.isAdmin ? 'Departments & Users' : 'Categories' }}</span>
        <button v-if="!isGuest" class="icon-btn" @click="openNewCat" title="Add category"><i class="bi bi-plus-lg"></i></button>
      </div>

      <div class="dept-list">
        <SidebarTreeNode
          v-for="node in sidebarTree"
          :key="node.id"
          :node="node"
          :selectedFilter="selectedFilter"
          :currentUserId="authStore.user?.id || ''"
          :isAdmin="authStore.isAdmin"
          :isGuest="isGuest"
          @select="selectedFilter = $event"
          @add-category="openNewSubCat"
          @edit-category="startEditCat"
          @delete-category="deleteCat"
        />
        <div v-if="!sidebarTree.length" class="cat-empty-hint">
          {{ authStore.isAdmin ? 'No departments or users found.' : 'No categories found.' }}
        </div>
      </div>

      <div class="sidebar-footer">
        <div class="stat-row"><i class="bi bi-file-earmark"></i><span>{{ templates.length }} templates</span></div>
        <div class="stat-row"><i class="bi bi-layers"></i><span>{{ totalPages }} pages total</span></div>
        <div class="stat-row"><i class="bi bi-clock-history"></i><span>{{ thisWeekCount }} this week</span></div>
      </div>
    </aside>

    <!-- ══ MAIN ═══════════════════════════════════════════════════ -->
    <div class="main-wrap">

      <!-- Top bar -->
      <header class="topbar">
        <div class="topbar-left">
          <div class="breadcrumb-title">
            <template v-if="Object.keys(selectedFilter).length === 0">
              <i class="bi bi-grid-2x2-fill me-2 text-primary"></i>All Templates
            </template>
            <template v-else-if="selectedFilter.uncategorized && !selectedFilter.department">
              <i class="bi bi-inbox me-2 text-muted"></i>Uncategorized
            </template>
            <template v-else>
              <span v-if="selectedFilter.department" class="text-secondary fw-normal me-2">{{ selectedFilter.department }} /</span>
              <span v-if="selectedFilter.username" class="text-secondary fw-normal me-2">{{ selectedFilter.username }} /</span>
              <span v-if="selectedFilter.category">
                <span class="bc-dot" :style="{ background: catColor(selectedFilter.category) }"></span>
                {{ selectedFilter.category }}
              </span>
              <span v-else-if="selectedFilter.uncategorized">Uncategorized</span>
              <span v-else>All</span>
            </template>
            <span class="bc-count">{{ displayedTemplates.length }}</span>
          </div>
        </div>

        <div class="topbar-search">
          <i class="bi bi-search"></i>
          <input ref="searchInput" v-model="search" type="text" placeholder="Search templates, tags…" />
          <kbd v-if="!search" class="search-kbd">/</kbd>
          <button v-else class="search-x" @click="search=''"><i class="bi bi-x"></i></button>
        </div>

        <div class="topbar-right">
          <button v-if="!isGuest" class="btn-primary-sm" @click="createNew">
            <i class="bi bi-plus-lg"></i> New Template
          </button>
          <router-link v-if="isGuest" to="/login" class="btn-primary-sm" style="text-decoration:none">
            <i class="bi bi-box-arrow-in-right"></i> Login
          </router-link>
        </div>
      </header>

      <!-- Guest banner -->
      <div v-if="isGuest" class="guest-banner">
        <i class="bi bi-eye"></i>
        <span>You are browsing as a <strong>Guest</strong>. Only public templates are visible. <router-link to="/login">Login</router-link> to create and manage templates.</span>
      </div>

      <!-- Tag filter bar -->
      <div v-if="allTags.length" class="tag-bar">
        <span class="tag-bar-label">Tags:</span>
        <button v-for="tag in allTags.slice(0,16)" :key="tag"
          class="tag-chip" :class="{ active: selectedTags.includes(tag) }"
          @click="toggleTag(tag)">#{{ tag }}</button>
        <button v-if="selectedTags.length" class="tag-clear" @click="selectedTags=[]">
          <i class="bi bi-x-circle"></i> Clear
        </button>
      </div>

      <!-- Toolbar -->
      <div class="content-bar">
        <div class="sort-wrap">
          <i class="bi bi-sort-down text-muted"></i>
          <select v-model="sortBy" class="sort-select">
            <option value="updatedAt">Last Modified</option>
            <option value="createdAt">Created</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
        <div class="view-toggle">
          <button :class="{ on: viewMode==='grid' }" @click="viewMode='grid'" title="Grid"><i class="bi bi-grid-3x3-gap-fill"></i></button>
          <button :class="{ on: viewMode==='list' }" @click="viewMode='list'" title="List"><i class="bi bi-list-ul"></i></button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="state-box">
        <div class="spinner"></div>
        <p>Loading templates…</p>
      </div>

      <!-- Empty -->
      <div v-else-if="!displayedTemplates.length" class="state-box">
        <div class="empty-art"><i class="bi bi-folder2-open"></i></div>
        <h6>No templates found</h6>
        <p class="text-sm text-muted">{{ search ? `No results for "${search}"` : 'Nothing in this category yet' }}</p>
        <button v-if="!isGuest" class="btn-primary-sm mt-2" @click="createNew"><i class="bi bi-plus-lg me-1"></i>New Template</button>
        <router-link v-if="isGuest" to="/login" class="btn-primary-sm mt-2" style="text-decoration:none"><i class="bi bi-box-arrow-in-right me-1"></i>Login to create templates</router-link>
      </div>

      <!-- ── GRID ─────────────────────────────────────────────── -->
      <div v-else-if="viewMode==='grid'" class="grid-area">
        <article v-for="t in displayedTemplates" :key="t.id" class="card" @click="(isGuest || (t.userId !== authStore.user?.id && !authStore.isAdmin)) ? openGenerate(t.id) : openEditor(t.id)">
          <div class="card-thumb">
            <div class="mini-page">
              <div class="mp-head" :style="t.category ? { background: catColor(t.category)+'22', borderColor: catColor(t.category)+'55' } : {}"></div>
              <div class="mp-line w80"></div>
              <div class="mp-line w55"></div>
              <div class="mp-table">
                <div class="mp-tr header" :style="t.category ? { background: catColor(t.category)+'44' } : {}"></div>
                <div class="mp-tr"></div>
                <div class="mp-tr alt"></div>
              </div>
              <div class="mp-line w65"></div>
            </div>
            <div v-if="t.category" class="cat-pill" :style="{ background: catColor(t.category) }">{{ t.category }}</div>
            <div v-if="t.visibility === 'public'" class="vis-pill" title="Public Template"><i class="bi bi-globe"></i></div>
            <div class="card-overlay">
              <button v-if="!isGuest && (t.userId === authStore.user?.id || authStore.isAdmin)" class="ov-btn" @click.stop="openEditor(t.id)" title="Edit"><i class="bi bi-pencil-fill"></i></button>
              <button class="ov-btn" @click.stop="openGenerate(t.id)" title="Generate PDF"><i class="bi bi-file-earmark-arrow-down-fill"></i></button>
              <button v-if="!isGuest && (t.userId === authStore.user?.id || authStore.isAdmin)" class="ov-btn" @click.stop="openCatModal(t)" title="Settings"><i class="bi bi-gear-fill"></i></button>
              <button v-if="!isGuest && (t.allowCopy || t.userId === authStore.user?.id || authStore.isAdmin)" class="ov-btn" @click.stop="openDupModal(t)" title="Duplicate"><i class="bi bi-copy"></i></button>
              <button v-if="!isGuest && (t.userId === authStore.user?.id || authStore.isAdmin)" class="ov-btn danger" @click.stop="confirmDelete(t)" title="Delete"><i class="bi bi-trash-fill"></i></button>
            </div>
          </div>
          <div class="card-body">
            <div class="card-name" :title="t.name">{{ t.name }}</div>
            <div class="card-meta">
              <span><i class="bi bi-file-earmark"></i> {{ t.pages?.length||0 }} page(s)</span>
              <span>{{ formatDate(t.updatedAt) }}</span>
            </div>
            <div class="card-meta mt-1">
              <span class="text-xs text-muted-bright">
                <i class="bi bi-person-circle"></i> {{ t.user?.username || 'Unknown' }}
              </span>
              <span class="text-xs text-muted-bright">Created: {{ formatDate(t.createdAt) }}</span>
            </div>
            <div class="id-copy-row mt-2" @click.stop="copyToClipboard(t.id)">
              <div class="id-badge-full">ID: {{ t.id.slice(0, 8) }}</div>
              <button class="id-copy-btn" title="Copy ID"><i class="bi bi-clipboard"></i></button>
            </div>
            <div v-if="t.description" class="card-desc mt-1">
              {{ t.description }}
            </div>
            <div v-if="t.tags?.length" class="card-tags mt-1">
              <span v-for="tag in t.tags.slice(0,3)" :key="tag" class="tag-sm">#{{ tag }}</span>
              <span v-if="t.tags.length>3" class="tag-more">+{{ t.tags.length-3 }}</span>
            </div>
          </div>
        </article>
      </div>

      <!-- ── LIST ─────────────────────────────────────────────── -->
      <div v-else class="list-area">
        <table class="list-table">
          <thead>
            <tr>
              <th>Template</th><th>Author / Category</th><th>Tags</th><th>Pages</th><th>Timeline</th><th style="text-align:right">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in displayedTemplates" :key="t.id" class="list-row" @click="(t.userId === authStore.user?.id || authStore.isAdmin) ? openEditor(t.id) : openGenerate(t.id)">
              <td>
                <div class="list-name-cell">
                  <div class="list-file-icon" :style="t.category ? { background: catColor(t.category)+'22', color: catColor(t.category) } : {}">
                    <i class="bi bi-file-earmark-pdf-fill"></i>
                  </div>
                  <div>
                    <div class="fw600">{{ t.name }}</div>
                    <div class="text-xs text-secondary-bright">{{ t.description || '' }}</div>
                    <div class="id-copy-row mt-1" @click.stop="copyToClipboard(t.id)">
                      <span class="id-badge-list">ID: {{ t.id.slice(0, 8) }}</span>
                      <i class="bi bi-clipboard ms-1 text-muted-bright clickable"></i>
                    </div>
                  </div>
                </div>
              </td>
              <td>
                <div class="mb-1 text-xs text-secondary-bright">
                  <i class="bi bi-person-circle"></i> {{ t.user?.username || 'Unknown' }}
                </div>
                <span v-if="t.category" class="list-cat-badge" :style="{ background: catColor(t.category)+'1a', color: catColor(t.category), borderColor: catColor(t.category)+'55' }">
                  <span class="list-cat-dot" :style="{ background: catColor(t.category) }"></span>{{ t.category }}
                </span>
              </td>
              <td>
                <div class="tags-row">
                  <span v-for="tag in (t.tags||[]).slice(0,3)" :key="tag" class="tag-sm">#{{ tag }}</span>
                  <span v-if="(t.tags||[]).length>3" class="tag-more">+{{ t.tags.length-3 }}</span>
                </div>
              </td>
              <td><span class="page-badge">{{ t.pages?.length||0 }}</span></td>
              <td class="text-sm">
                <div class="text-secondary-bright"><span class="text-muted-bright text-xs">C:</span> {{ formatDate(t.createdAt) }}</div>
                <div class="text-secondary-bright"><span class="text-muted-bright text-xs">U:</span> {{ formatDate(t.updatedAt) }}</div>
              </td>
              <td @click.stop>
                <div class="list-actions">
                  <button v-if="t.userId === authStore.user?.id || authStore.isAdmin" class="action-btn primary" @click="openEditor(t.id)" title="Edit"><i class="bi bi-pencil"></i></button>
                  <button class="action-btn success" @click="openGenerate(t.id)" title="Generate"><i class="bi bi-file-earmark-arrow-down"></i></button>
                  <button class="action-btn" @click="openCatModal(t)" title="Category &amp; Tags"><i class="bi bi-tag"></i></button>
                  <button class="action-btn" @click="openDupModal(t)" title="Duplicate"><i class="bi bi-copy"></i></button>
                  <button class="action-btn danger" @click="confirmDelete(t)" title="Delete"><i class="bi bi-trash"></i></button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ MODALS ════════════════════════════════════════════════ -->
    <Teleport to="body">
      <div v-if="showAddCat||editingCat" class="modal-bg" @click.self="closeCatForm">
        <div class="modal-card">
          <div class="modal-head">
            <span>{{ editingCat ? 'Edit Category' : 'New Category' }}</span>
            <button class="icon-btn" @click="closeCatForm"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <label class="field-label">Name</label>
            <input v-model="catForm.name" class="field-input" type="text"
              placeholder="e.g. Finance, HR, Sales" @keydown.enter="saveCat" autofocus />
            <label class="field-label mt-3">Color</label>
            <div class="color-row">
              <button v-for="c in PRESET_COLORS" :key="c" class="color-btn"
                :class="{ sel: catForm.color===c }" :style="{ background: c }" @click="catForm.color=c"></button>
            </div>
            
            <label class="field-label mt-3">Parent Category (Optional)</label>
            <div class="cat-select-list" style="max-height: 140px; overflow-y: auto;">
               <button class="cat-select-item py-1" :class="{ sel: !catForm.parentId }" @click="catForm.parentId=null">
                 <i class="bi bi-slash-circle text-muted me-2"></i>None (Root)
               </button>
               <button v-for="cat in catFormTree" :key="cat.id" class="cat-select-item py-1"
                 :class="{ sel: catForm.parentId===cat.id }"
                 :style="{ paddingLeft: (12 + cat.depth * 20) + 'px', opacity: (cat.id === editingCat?.id || isDescendant(cat.id, editingCat?.id)) ? 0.5 : 1 }"
                 :disabled="cat.id === editingCat?.id || isDescendant(cat.id, editingCat?.id)"
                 @click="catForm.parentId=cat.id">
                 <span class="cat-swatch sm" :style="{ background: cat.color }"></span>{{ cat.name }}
               </button>
            </div>
            <div v-if="catForm.name" class="cat-preview">
              Preview: <span class="cat-pill-inline" :style="{ background: catForm.color }">{{ catForm.name }}</span>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click="closeCatForm">Cancel</button>
            <button class="btn-primary-sm" @click="saveCat" :disabled="!catForm.name.trim()">
              {{ editingCat ? 'Save Changes' : 'Create Category' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="catModalTarget" class="modal-bg" @click.self="catModalTarget=null">
        <div class="modal-card">
          <div class="modal-head">
            <span><i class="bi bi-gear me-2"></i>Template Settings</span>
            <button class="icon-btn" @click="catModalTarget=null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <div class="tpl-name-badge">
              <i class="bi bi-file-earmark-pdf-fill me-2 text-primary"></i>{{ catModalTarget.name }}
            </div>
            <label class="field-label mt-3">Category</label>
            <div class="cat-select-list" style="max-height: 180px; overflow-y: auto;">
              <button class="cat-select-item" :class="{ sel: catModalForm.category==='' }" @click="catModalForm.category=''">
                <i class="bi bi-slash-circle text-muted me-2"></i>None
              </button>
              <button v-for="cat in catModalTree" :key="cat.name"
                class="cat-select-item" :class="{ sel: catModalForm.category===cat.name }"
                :style="{ paddingLeft: (12 + cat.depth * 20) + 'px' }"
                @click="catModalForm.category=cat.name">
                <span class="cat-swatch sm" :style="{ background: cat.color }"></span>{{ cat.name }}
              </button>
            </div>
            
            <label class="field-label mt-3">Template Description (Detail)</label>
            <textarea v-model="catModalForm.description" class="field-input" rows="2" placeholder="Describe this template..."></textarea>

            <label class="field-label mt-3">Tags <span class="text-muted text-xs">(comma separated)</span></label>
            <input v-model="catModalForm.tagsInput" class="field-input" type="text" placeholder="invoice, monthly, client" />
            <div v-if="allTags.length" class="tag-suggest">
              <span class="text-xs text-muted me-1">Existing:</span>
              <button v-for="tag in allTags.slice(0,14)" :key="tag" class="tag-sug-btn"
                :class="{ active: catModalForm.tagsInput.split(',').map(s=>s.trim()).includes(tag) }"
                @click="toggleTagSuggestion(tag)">#{{ tag }}</button>
            </div>
            
            <label class="field-label mt-3">Visibility</label>
            <select v-model="catModalForm.visibility" class="field-input">
              <option value="private">Private (Only me)</option>
              <option value="public">Public (Anyone logged in)</option>
            </select>

            <div class="mt-3 d-flex align-items-center">
              <input type="checkbox" id="allowCopy" v-model="catModalForm.allowCopy" class="form-check-input me-2 mt-0">
              <label for="allowCopy" class="field-label mb-0" style="cursor:pointer">Allow others to copy this template</label>
            </div>

            <ApiKeyManager v-if="catModalTarget && (catModalTarget.userId === authStore.user?.id || authStore.isAdmin)" :templateId="catModalTarget.id" />
          </div>
          <div v-if="catModalError" class="modal-error">
            <i class="bi bi-exclamation-circle me-1"></i>{{ catModalError }}
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click="catModalTarget=null; catModalError=''" :disabled="catModalSaving">Cancel</button>
            <button class="btn-primary-sm" @click="saveCatModal" :disabled="catModalSaving">
              <span v-if="catModalSaving" class="mini-spinner"></span>
              <i v-else class="bi bi-check-lg me-1"></i>
              {{ catModalSaving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="deleteTarget" class="modal-bg" @click.self="deleteTarget=null">
        <div class="modal-card modal-sm">
          <div class="modal-head danger-head">
            <span><i class="bi bi-exclamation-triangle-fill me-2"></i>Delete Template</span>
            <button class="icon-btn" @click="deleteTarget=null"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <p>Delete <strong>{{ deleteTarget.name }}</strong>?</p>
            <p class="text-sm text-muted mt-1">This action cannot be undone.</p>
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click="deleteTarget=null">Cancel</button>
            <button class="btn-danger-sm" @click="doDelete">Delete</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="dupModalTarget" class="modal-bg" @click.self="dupModalTarget=null; dupModalError=''">
        <div class="modal-card">
          <div class="modal-head">
            <span>Duplicate Template</span>
            <button class="icon-btn" @click="dupModalTarget=null; dupModalError=''"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="modal-body">
            <p>Copy <strong>{{ dupModalTarget.name }}</strong>?</p>
            
            <label v-if="authStore.isAdmin" class="field-label mt-3">Target User</label>
            <select v-if="authStore.isAdmin" v-model="dupModalForm.targetUserId" class="field-input">
              <option value="">-- Same as Original --</option>
              <option v-for="u in dupModalUsers" :key="u.id" :value="u.id">
                {{ u.username }} 
                <span v-if="u.department !== 'No Department'">({{ u.department }})</span>
              </option>
            </select>

            <label class="field-label mt-3">Target Category (Optional)</label>
            <div class="cat-select-list" style="max-height: 180px; overflow-y: auto;">
               <button class="cat-select-item py-1" :class="{ sel: !dupModalForm.targetCategory }" @click="dupModalForm.targetCategory=''">
                 <i class="bi bi-slash-circle text-muted me-2"></i>None (Uncategorized)
               </button>
               <button v-for="cat in dupModalTree" :key="cat.id" class="cat-select-item py-1"
                 :class="{ sel: dupModalForm.targetCategory===cat.name }"
                 :style="{ paddingLeft: (12 + cat.depth * 20) + 'px' }"
                 @click="dupModalForm.targetCategory=cat.name">
                 <span class="cat-swatch sm" :style="{ background: cat.color }"></span>{{ cat.name }}
               </button>
            </div>
            
            <div v-if="dupModalError" class="modal-error mt-3">
              <i class="bi bi-exclamation-circle me-1"></i>{{ dupModalError }}
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn-ghost" @click="dupModalTarget=null; dupModalError=''" :disabled="dupModalSaving">Cancel</button>
            <button class="btn-primary-sm" @click="saveDupModal" :disabled="dupModalSaving">
              <span v-if="dupModalSaving" class="mini-spinner"></span>
              <i v-else class="bi bi-copy me-1"></i>
              {{ dupModalSaving ? 'Duplicating…' : 'Duplicate' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <PdfImportDialog v-if="showImport" @close="showImport=false" @imported="onImported" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { templatesApi, categoriesApi, usersApi } from '../api'
import PdfImportDialog from '../components/PdfImportDialog.vue'
import ApiKeyManager from '../components/ApiKeyManager.vue'
import SidebarTreeNode from '../components/SidebarTreeNode.vue'

const router    = useRouter()
const authStore = useAuthStore()
const templates = ref([])
const allUsers  = ref([])
const loading   = ref(false)
const search    = ref('')
const viewMode  = ref('grid')
const sortBy    = ref('updatedAt')
const selectedFilter = ref({})
const selectedTags = ref([])
const showImport   = ref(false)
const searchInput  = ref(null)

const PRESET_COLORS = [
  '#1a56db','#0891b2','#10b981','#84cc16',
  '#f59e0b','#f97316','#ef4444','#ec4899',
  '#8b5cf6','#6366f1','#64748b','#1e293b',
]
const categories = ref([])
const showAddCat  = ref(false)
const editingCat  = ref(null)
const catForm     = ref({ name: '', color: PRESET_COLORS[0], parentId: null })

// Guest = not authenticated at all
const isGuest = computed(() => !authStore.isAuthenticated)

const sidebarTree = computed(() => {
  const tree = []
  const catsByUser = {}
  categories.value.forEach(c => {
    if (!catsByUser[c.userId]) catsByUser[c.userId] = []
    catsByUser[c.userId].push({ ...c, children: [] })
  })

  // Build dept map from ALL USERS (not from templates) - used for structure only
  const deptsMap = {}
  allUsers.value.forEach(u => {
    const deptName = u.department?.name || 'No Department'
    if (!deptsMap[deptName]) deptsMap[deptName] = { users: {} }
    if (!deptsMap[deptName].users[u.username]) {
      deptsMap[deptName].users[u.username] = { userId: u.id, templates: [] }
    }
  })

  // Populate templates into user buckets (for count display)
  templates.value.forEach(t => {
    const rawDept = t.user?.department?.name
    const deptName = rawDept || 'No Department'
    const userName = t.user?.username || 'Unknown User'
    const userId = t.userId || t.user?.id
    if (!deptsMap[deptName]) deptsMap[deptName] = { users: {} }
    if (!deptsMap[deptName].users[userName]) {
      deptsMap[deptName].users[userName] = { userId: userId, templates: [] }
    }
    deptsMap[deptName].users[userName].templates.push(t)
  })

  for (const [deptName, deptObj] of Object.entries(deptsMap)) {
    const deptNode = {
      type: 'department',
      id: `dept_${deptName}`,
      name: deptName,
      filter: { department: deptName },
      count: 0,
      children: []
    }

    for (const [userName, userObj] of Object.entries(deptObj.users)) {
      const uId = userObj.userId
      const userTplCount = userObj.templates.length
      const userNode = {
        type: 'user',
        id: `usr_${userName}`,
        name: userName,
        filter: { department: deptName, username: userName, userId: uId },
        count: userTplCount,
        children: []
      }
      deptNode.count += userTplCount
      
      const list = catsByUser[uId] || []
      const catMap = {}
      list.forEach(c => catMap[c.id] = c)
      const roots = []
      list.forEach(c => {
        if (c.parentId && catMap[c.parentId]) catMap[c.parentId].children.push(catMap[c.id])
        else roots.push(catMap[c.id])
      })
      
      const toNode = (c) => {
        const node = {
          type: 'category',
          id: c.id,
          name: c.name,
          color: c.color,
          filter: { department: deptName, username: userName, category: c.name, userId: uId },
          count: userObj.templates.filter(t => t.category === c.name).length,
          children: []
        };
        node.children = c.children.map(toNode);
        node.count += node.children.reduce((sum, child) => sum + child.count, 0);
        return node;
      }

      userNode.children.push(...roots.map(toNode))
      
      const uncatCount = userObj.templates.filter(t => !t.category).length
      if (uncatCount > 0) {
        userNode.children.push({
          type: 'uncategorized',
          id: `uncat_${userName}`,
          name: 'Uncategorized',
          filter: { department: deptName, username: userName, uncategorized: true, userId: uId },
          count: uncatCount,
          children: []
        })
      }
      deptNode.children.push(userNode)
    }
    tree.push(deptNode)
  }

  tree.sort((a, b) => {
    if (a.name === 'No Department') return 1
    if (b.name === 'No Department') return -1
    return a.name.localeCompare(b.name)
  })
  return tree
})

const flattenTree = (nodes, depth = 0) => {
  return nodes.reduce((acc, n) => {
    acc.push({ ...n, depth })
    acc.push(...flattenTree(n.children, depth + 1))
    return acc
  }, [])
}

const catModalTree = computed(() => {
  if (!catModalTarget.value) return []
  const uId = catModalTarget.value.userId || catModalTarget.value.user?.id
  const list = categories.value.filter(c => c.userId === uId)
  const catMap = {}
  list.forEach(c => catMap[c.id] = { ...c, children: [] })
  const roots = []
  list.forEach(c => {
    if (c.parentId && catMap[c.parentId]) catMap[c.parentId].children.push(catMap[c.id])
    else roots.push(catMap[c.id])
  })
  return flattenTree(roots)
})

const catFormTree = computed(() => {
  const uId = catForm.value.userId || editingCat.value?.userId || authStore.user?.id
  const list = categories.value.filter(c => c.userId === uId)
  const catMap = {}
  list.forEach(c => catMap[c.id] = { ...c, children: [] })
  const roots = []
  list.forEach(c => {
    if (c.parentId && catMap[c.parentId]) catMap[c.parentId].children.push(catMap[c.id])
    else roots.push(catMap[c.id])
  })
  return flattenTree(roots)
})

const isDescendant = (childId, ancestorId) => {
  if (!ancestorId) return false
  let current = categories.value.find(c => c.id === childId)
  while (current && current.parentId) {
    if (current.parentId === ancestorId) return true
    current = categories.value.find(c => c.id === current.parentId)
  }
  return false
}

const dupModalTree = computed(() => {
  const uId = dupModalForm.value.targetUserId || authStore.user?.id
  const list = categories.value.filter(c => c.userId === uId)
  const catMap = {}
  list.forEach(c => catMap[c.id] = { ...c, children: [] })
  const roots = []
  list.forEach(c => {
    if (c.parentId && catMap[c.parentId]) catMap[c.parentId].children.push(catMap[c.id])
    else roots.push(catMap[c.id])
  })
  return flattenTree(roots)
})

const dupModalUsers = computed(() => {
  // Extract all distinct users from the templates list for the Admin dropdown 
  // (In a real scenario, an Admin might fetch all users from usersApi. 
  // For this UI, we can extract from the existing template map or create a simple unique list)
  const usersMap = new Map()
  templates.value.forEach(t => {
    if (t.user) usersMap.set(t.user.id, { id: t.user.id, username: t.user.username, department: t.user.department?.name || 'No Department' })
    else if (t.userId) usersMap.set(t.userId, { id: t.userId, username: 'Unknown User', department: 'No Department' }) // Fallback
  })
  if (authStore.user) usersMap.set(authStore.user.id, { id: authStore.user.id, username: authStore.user.username, department: authStore.user.department?.name || 'No Department' })
  return Array.from(usersMap.values()).sort((a,b) => a.username.localeCompare(b.username))
})

async function loadCats() {
  try {
    const res = await categoriesApi.getAll()
    categories.value = res.data
  } catch(e) { console.error('loadCats', e); categories.value = [] }
}
function catColor(name) { return categories.value.find(c => c.name === name)?.color || '#94a3b8' }
function openNewCat() { 
  catForm.value = { name: '', color: PRESET_COLORS[0], parentId: null, userId: authStore.isAdmin ? null : authStore.user?.id }
  showAddCat.value = true 
}
function openNewSubCat(node) {
  if (node.isUserRoot) {
    catForm.value = { name: '', color: PRESET_COLORS[0], parentId: null, userId: node.filter?.username ? node.filter.userId : null }
  } else {
    catForm.value = { name: '', color: node.color || PRESET_COLORS[0], parentId: node.id, userId: node.filter?.username ? node.filter.userId : null }
  }
  showAddCat.value = true
}
function startEditCat(node) { editingCat.value = categories.value.find(c => c.id === node.id); catForm.value = { name: node.name, color: node.color, parentId: editingCat.value?.parentId } }
function closeCatForm() { showAddCat.value = false; editingCat.value = null; catForm.value = { name: '', color: PRESET_COLORS[0], parentId: null } }
async function saveCat() {
  const name = catForm.value.name.trim(); if (!name) return
  try {
    if (editingCat.value) {
      const res = await categoriesApi.update(editingCat.value.id, { name, color: catForm.value.color, parentId: catForm.value.parentId })
      const oldName = editingCat.value.name
      const idx = categories.value.findIndex(c => c.id === editingCat.value.id)
      if (idx !== -1) categories.value[idx] = res.data
      
      const affected = templates.value.filter(t => t.category === oldName) // Since category names are unique per user, this is mostly safe, but if admin editing it updates all matching name. Wait, the category scope is user.
      for (const t of affected) { t.category = name; await saveTemplateMeta(t) }
      if (selectedFilter.value.category === oldName) selectedFilter.value = { ...selectedFilter.value, category: name }
    } else {
      const parentId = catForm.value.parentId || null;
      const targetUserId = catForm.value.userId || null;
      const res = await categoriesApi.create({ name, color: catForm.value.color, parentId, userId: targetUserId })
      if (!categories.value.find(c => c.id === res.data.id))
        categories.value.push(res.data)
    }
  } catch(e) { console.error(e) }
  closeCatForm()
}

async function deleteCat(node) {
  if (!confirm(`Remove category "${node.name}"? Templates will be uncategorized.`)) return
  try {
    await categoriesApi.delete(node.id)
    categories.value = categories.value.filter(c => c.id !== node.id)
    const affected = templates.value.filter(t => t.category === node.name && t.user?.username === node.filter?.username)
    for (const t of affected) { t.category = null; await saveTemplateMeta(t) }
    if (selectedFilter.value.category === node.name) selectedFilter.value = { ...selectedFilter.value, category: null, uncategorized: true }
  } catch(e) { console.error(e) }
}

const catModalTarget = ref(null)
const catModalForm   = ref({ category: '', description: '', tagsInput: '', visibility: 'private', allowCopy: false })
function openCatModal(t) {
  catModalTarget.value = t
  catModalForm.value = { 
    category: t.category || '', 
    description: t.description || '',
    tagsInput: (t.tags||[]).join(', '),
    visibility: t.visibility || 'private',
    allowCopy: !!t.allowCopy
  }
}
function toggleTagSuggestion(tag) {
  const arr = catModalForm.value.tagsInput.split(',').map(s=>s.trim()).filter(Boolean)
  const idx = arr.indexOf(tag)
  if (idx===-1) arr.push(tag); else arr.splice(idx,1)
  catModalForm.value.tagsInput = arr.join(', ')
}
const catModalSaving = ref(false)
const catModalError  = ref('')

async function saveCatModal() {
  const t = catModalTarget.value; if (!t) return
  const tags     = catModalForm.value.tagsInput.split(',').map(s => s.trim()).filter(Boolean)
  const category = catModalForm.value.category || null

  catModalSaving.value = true
  catModalError.value  = ''
  try {
    // 1. Ensure category exists in DB for this user (create if new)
    const uId = t.userId || t.user?.id;
    if (category && !categories.value.find(c => c.name === category && c.userId === uId)) {
      const color = PRESET_COLORS[categories.value.length % PRESET_COLORS.length]
      const res = await categoriesApi.create({ name: category, color, userId: uId })
      categories.value.push(res.data)
    }

    // 2. Save category + tags + ACL into template row in DB
    const res = await templatesApi.update(t.id, { 
      category, 
      description: catModalForm.value.description,
      tags,
      visibility: catModalForm.value.visibility,
      allowCopy: catModalForm.value.allowCopy
    })

    // 3. Update local state from what DB returned (source of truth)
    t.category = res.data.category ?? null
    t.description = res.data.description ?? ''
    t.tags     = Array.isArray(res.data.tags) ? res.data.tags : []
    t.visibility = res.data.visibility
    t.allowCopy = res.data.allowCopy

    catModalTarget.value = null
  } catch(e) {
    console.error('saveCatModal failed:', e)
    catModalError.value = 'Save failed — please try again'
  } finally {
    catModalSaving.value = false
  }
}
async function saveTemplateMeta(t) {
  try { await templatesApi.update(t.id, { category: t.category || null, tags: t.tags || [] }) } catch(e) { console.error(e) }
}

const allTags = computed(() => {
  const s = new Set()
  templates.value.forEach(t => (t.tags||[]).forEach(g => s.add(g)))
  return [...s].sort()
})
function toggleTag(tag) {
  const i = selectedTags.value.indexOf(tag)
  if (i===-1) selectedTags.value.push(tag); else selectedTags.value.splice(i,1)
}

const displayedTemplates = computed(() => {
  let list = templates.value
  
  const f = selectedFilter.value
  if (f.department) list = list.filter(t => (t.user?.department?.name || 'No Department') === f.department)
  if (f.username) list = list.filter(t => (t.user?.username || 'Unknown User') === f.username)
  if (f.category) list = list.filter(t => t.category === f.category)
  if (f.uncategorized) list = list.filter(t => !t.category)
  
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description||'').toLowerCase().includes(q) ||
      (t.category||'').toLowerCase().includes(q) ||
      (t.tags||[]).some(tag => tag.toLowerCase().includes(q))
    )
  }
  if (selectedTags.value.length)
    list = list.filter(t => selectedTags.value.every(tag => (t.tags||[]).includes(tag)))
  return [...list].sort((a,b) =>
    sortBy.value === 'name' ? a.name.localeCompare(b.name) : new Date(b[sortBy.value])-new Date(a[sortBy.value])
  )
})

const totalPages    = computed(() => templates.value.reduce((a,t)=>a+(t.pages?.length||0),0))
const thisWeekCount = computed(() => templates.value.filter(t=>Date.now()-new Date(t.createdAt)<7*86400000).length)

onMounted(async () => {
  loading.value = true
  try {
    const [catsRes, tplsRes, usersRes] = await Promise.all([
      categoriesApi.getAll(),
      templatesApi.getAll(),
      usersApi.getVisible(),
    ])
    categories.value = catsRes.data
    templates.value  = tplsRes.data
    allUsers.value   = usersRes.data

    // Sync: if any template has a category string not in categories table for THAT USER → create it
    for (const t of tplsRes.data) {
      if (t.category) {
        const uId = t.userId || t.user?.id;
        const userHasCat = categories.value.some(c => c.name === t.category && c.userId === uId);
        if (!userHasCat) {
          const color = PRESET_COLORS[categories.value.length % PRESET_COLORS.length]
          const res = await categoriesApi.create({ name: t.category, color, userId: uId })
          categories.value.push(res.data)
        }
      }
    }
  } catch(e) { console.error(e) }
  finally { loading.value = false }
  window.addEventListener('keydown', e => {
    if (e.key==='/' && !['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) {
      e.preventDefault(); searchInput.value?.focus()
    }
  })
})

const deleteTarget = ref(null)
function createNew()      { router.push('/editor') }
function openEditor(id)   { router.push(`/editor/${id}`) }
function openGenerate(id) { router.push(`/generate/${id}`) }
function onImported(t)    { templates.value.unshift(t); router.push('/editor/'+t.id) }
const dupModalTarget = ref(null)
const dupModalForm   = ref({ targetUserId: '', targetCategory: '' })
const dupModalSaving = ref(false)
const dupModalError  = ref('')

function openDupModal(t) {
  dupModalTarget.value = t
  dupModalError.value = ''
  
  if (authStore.isAdmin && selectedFilter.value) {
    dupModalForm.value.targetUserId = selectedFilter.value.userId || ''
    dupModalForm.value.targetCategory = selectedFilter.value.category || ''
  } else {
    dupModalForm.value.targetUserId = authStore.user?.id || ''
    dupModalForm.value.targetCategory = ''
  }
}

async function saveDupModal() {
  if (!dupModalTarget.value) return
  dupModalSaving.value = true
  dupModalError.value = ''
  try {
    const payload = {}
    if (dupModalForm.value.targetUserId) payload.targetUserId = dupModalForm.value.targetUserId
    if (dupModalForm.value.targetCategory) payload.targetCategory = dupModalForm.value.targetCategory
    
    const res = await templatesApi.duplicate(dupModalTarget.value.id, payload)
    templates.value.unshift(res.data)
    dupModalTarget.value = null
  } catch(e) {
    console.error('Duplicate failed:', e)
    dupModalError.value = e.response?.data?.message || 'Failed to duplicate template.'
  } finally {
    dupModalSaving.value = false
  }
}
function confirmDelete(t) { deleteTarget.value = t }
async function doDelete() {
  if (!deleteTarget.value) return
  try {
    await templatesApi.delete(deleteTarget.value.id)
    templates.value = templates.value.filter(t => t.id !== deleteTarget.value.id)
    deleteTarget.value = null
  } catch(e) { console.error(e) }
}
function formatDate(d) {
  if (!d) return ''
  const diff = Date.now()-new Date(d)
  if (diff < 3600000)   return 'Just now'
  if (diff < 86400000)  return `${Math.floor(diff/3600000)}h ago`
  if (diff < 604800000) return `${Math.floor(diff/86400000)}d ago`
  return new Date(d).toLocaleDateString('th-TH',{day:'numeric',month:'short',year:'numeric'})
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'ID copied to clipboard!', type: 'success' } }));
  } catch (err) {
    console.error('Failed to copy: ', err);
  }
}
</script>

<style scoped>
.home-root { display:flex; height:100vh; overflow:hidden; background:#1e293b; font-family:'Sarabun','Segoe UI',sans-serif; color: #f1f5f9; }

/* Sidebar */
.sidebar { width:240px; flex-shrink:0; background:#0f172a; display:flex; flex-direction:column; overflow-y:auto; scrollbar-width:none; }
.sidebar::-webkit-scrollbar { display:none; }
.sidebar-logo { display:flex; align-items:center; gap:10px; padding:20px 18px 16px; border-bottom:1px solid #1e293b; }
.logo-icon { width:34px; height:34px; background:#1a56db; border-radius:9px; display:flex; align-items:center; justify-content:center; font-size:17px; color:white; }
.logo-text { font-size:15px; font-weight:700; color:white; letter-spacing:-.01em; }
.sidebar-nav { padding:10px 10px 4px; }
.nav-item { width:100%; display:flex; align-items:center; gap:9px; padding:9px 12px; border:none; background:none; border-radius:8px; font-size:13px; color:#94a3b8; text-align:left; cursor:pointer; transition:all .14s; margin-bottom:2px; }
.nav-item:hover { background:#1e293b; color:#e2e8f0; }
.nav-item.active { background:#1a56db20; color:#60a5fa; }
.nav-icon { font-size:14px; flex-shrink:0; }
.nav-badge { margin-left:auto; font-size:11px; background:#1e293b; color:#64748b; border-radius:20px; padding:1px 8px; min-width:22px; text-align:center; }
.nav-item.active .nav-badge { background:#1a56db30; color:#93c5fd; }
.sidebar-section-head { display:flex; align-items:center; justify-content:space-between; padding:14px 18px 6px; font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:.08em; }
.dept-list { padding:4px 10px; }
.cat-row { display:flex; align-items:center; border-radius:8px; margin-bottom:2px; }
.cat-row:hover .cat-row-actions { opacity:1; }
.cat-row.active .cat-btn { color:#e2e8f0; background:#1e293b; }
.cat-btn { flex:1; display:flex; align-items:center; gap:8px; padding:8px 10px; border:none; background:none; font-size:13px; color:#94a3b8; text-align:left; cursor:pointer; border-radius:8px; transition:all .14s; }
.cat-btn:hover { background:#1e293b; color:#cbd5e1; }
.cat-label { flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.cat-swatch { width:10px; height:10px; border-radius:50%; flex-shrink:0; }
.cat-swatch.sm { width:8px; height:8px; }
.cat-row-actions { display:flex; gap:2px; opacity:0; transition:opacity .15s; padding-right:4px; flex-shrink:0; }
.cat-empty-hint { font-size:12px; color:#475569; padding:8px 10px; }
.sidebar-footer { margin-top:auto; padding:14px 18px 16px; border-top:1px solid #1e293b; }
.stat-row { display:flex; align-items:center; gap:8px; font-size:11.5px; color:#64748b; padding:3px 0; }
.stat-row i { font-size:12px; color:#475569; }

/* Main */
.main-wrap { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; background: #1e293b; }
.topbar { height:58px; background:rgba(30, 41, 59, 0.85); border-bottom:1px solid #334155; display:flex; align-items:center; gap:12px; padding:0 24px; flex-shrink:0; backdrop-filter: blur(10px); }
.guest-banner { background:#fef9c3; border-bottom:1px solid #fde047; padding:8px 20px; display:flex; align-items:center; gap:10px; font-size:13px; color:#713f12; flex-shrink:0; }
.guest-banner i { font-size:15px; }
.guest-banner a { color:#1a56db; font-weight:600; }

.topbar-left { flex-shrink:0; }
.breadcrumb-title { display:flex; align-items:center; font-size:16px; font-weight:700; color:#f1f5f9; gap:8px; }
.bc-dot { width:11px; height:11px; border-radius:50%; flex-shrink:0; }
.bc-count { font-size:12px; font-weight:500; background:#1e293b; color:#94a3b8; border-radius:20px; padding:1px 9px; }
.topbar-search { flex:1; max-width:420px; position:relative; display:flex; align-items:center; }
.topbar-search i { position:absolute; left:12px; font-size:13px; color:#475569; }
.topbar-search input { width:100%; border:1.5px solid #334155; border-radius:10px; padding:8px 34px; font-size:13px; outline:none; background:#0f172a; color: #f1f5f9; transition:all .15s; }
.topbar-search input:focus { border-color:#3b82f6; background:#020617; box-shadow:0 0 0 3px rgba(59,130,246,.15); }
.search-kbd { position:absolute; right:12px; font-size:10px; color:#475569; border:1px solid #334155; border-radius:4px; padding:1px 5px; background:rgba(0,0,0,0.2); }
.search-x { position:absolute; right:8px; border:none; background:none; color:#64748b; cursor:pointer; font-size:15px; }
.topbar-right { margin-left:auto; display:flex; align-items:center; gap:8px; flex-shrink:0; }
.tag-bar { display:flex; align-items:center; gap:6px; flex-wrap:wrap; padding:10px 24px; background:rgba(30, 41, 59, 0.6); border-bottom:1px solid #334155; flex-shrink:0; }
.tag-bar-label { font-size:10px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.1em; flex-shrink:0; }
.tag-chip { border:1.5px solid #1e293b; background:#1e293b; color:#94a3b8; border-radius:20px; padding:2px 12px; font-size:11px; cursor:pointer; transition:all .12s; }
.tag-chip:hover { border-color:#3b82f6; color:#f8fafc; }
.tag-chip.active { border-color:#2563eb; color:white; background:#2563eb30; font-weight:600; }
.tag-clear { border:none; background:none; color:#ef4444; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:4px; margin-left:6px; font-weight:600; }
.content-bar { display:flex; align-items:center; justify-content:space-between; padding:10px 24px; background:rgba(30, 41, 59, 0.4); border-bottom:1px solid #334155; flex-shrink:0; }
.sort-wrap { display:flex; align-items:center; gap:8px; }
.sort-select { border:1.5px solid #1e293b; border-radius:8px; padding:5px 12px; font-size:12px; outline:none; background:#1e293b; color:#cbd5e1; cursor:pointer; transition:all .2s; }
.sort-select:hover { border-color:#334155; }
.view-toggle { display:flex; gap:4px; }
.view-toggle button { width:34px; height:34px; border:1.5px solid #1e293b; background:#1e293b; border-radius:8px; font-size:14px; color:#64748b; cursor:pointer; transition:all .12s; display:flex; align-items:center; justify-content:center; }
.view-toggle button.on { background:#3b82f6; color:white; border-color:#3b82f6; }
.view-toggle button:hover:not(.on) { background:#334155; color:#cbd5e1; }

/* States */
.state-box { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:80px 20px; gap:16px; color: #64748b; }
.spinner { width:36px; height:36px; border:3px solid rgba(59, 130, 246, 0.1); border-top-color:#3b82f6; border-radius:50%; animation:spin .8s cubic-bezier(.4, 0, .2, 1) infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
.empty-art { font-size:64px; color:#1e293b; margin-bottom: 8px; }

/* Grid */
.grid-area { flex:1; overflow-y:auto; padding:24px; display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:20px; align-content:start; }
.card { background:rgba(51, 65, 85, 0.4); border-radius:16px; border:1px solid #475569; overflow:hidden; cursor:pointer; transition:all .2s ease-out; backdrop-filter: blur(6px); }
.card:hover { transform:translateY(-6px); box-shadow:0 20px 40px rgba(0,0,0,.4); border-color:#3b82f6; background:rgba(51, 65, 85, 0.6); }
.card-thumb { background:linear-gradient(145deg, #1e293b, #0f172a); height:140px; position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden; border-bottom: 1px solid #1e293b; }
.mini-page { background:#f8fafc; width:80px; height:106px; border-radius:4px; box-shadow:0 8px 16px rgba(0,0,0,.4); padding:9px 8px; display:flex; flex-direction:column; gap:5px; }
.mp-head { height:14px; border-radius:3px; background:#eff6ff; border:1px solid #bfdbfe; }
.mp-line { height:3px; border-radius:2px; background:#e2e8f0; width:100%; }
.mp-line.w80 { width:80%; }
.mp-line.w55 { width:55%; }
.mp-line.w65 { width:65%; }
.mp-table { display:flex; flex-direction:column; gap:2px; margin:1px 0; }
.mp-tr { height:6px; border-radius:2px; background:#f1f5f9; }
.mp-tr.header { background:#dbeafe; }
.mp-tr.alt { background:#f8fafc; }
.cat-pill { position:absolute; top:8px; left:8px; font-size:10px; font-weight:600; color:white; padding:2px 9px; border-radius:20px; max-width:130px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; box-shadow:0 1px 4px rgba(0,0,0,.2); }
.vis-pill { position:absolute; top:8px; right:8px; font-size:12px; color:white; background:rgba(0,0,0,0.5); width: 22px; height: 22px; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 1px 4px rgba(0,0,0,.2); }
.cat-pill-inline { font-size:11px; font-weight:700; color:white; padding:2px 12px; border-radius:20px; box-shadow: 0 2px 8px rgba(0,0,0,.2); }
.card-overlay { position:absolute; inset:0; background:rgba(15,23,42,.6); backdrop-filter:blur(2px); display:flex; align-items:center; justify-content:center; gap:6px; opacity:0; transition:opacity .16s; }
.card:hover .card-overlay { opacity:1; }
.ov-btn { width:32px; height:32px; border-radius:8px; border:none; background:rgba(255,255,255,.1); color:white; font-size:13px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all .12s; backdrop-filter: blur(4px); }
.ov-btn:hover { background:#3b82f6; transform:scale(1.1); }
.ov-btn.danger { color:#f87171; }
.ov-btn.danger:hover { background:#ef4444; color: white; }
.card-body { padding:14px 16px 16px; }
.card-name { font-weight:700; font-size:14px; color:#f8fafc; margin-bottom:6px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.card-meta { display:flex; justify-content:space-between; font-size:11px; color:#cbd5e1; margin-bottom:6px; }
.card-tags { display:flex; gap:4px; flex-wrap:wrap; }

/* List */
.list-area { flex:1; overflow-y:auto; padding:20px 24px; }
.list-table { width:100%; border-collapse:collapse; background:rgba(51, 65, 85, 0.3); border-radius:16px; overflow:hidden; border: 1px solid #475569; backdrop-filter: blur(6px); }
.list-table thead th { background:rgba(30, 41, 59, 0.7); padding:14px 16px; font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.12em; border-bottom:1px solid #475569; }
.list-row { cursor:pointer; transition:background .15s; }
.list-row:hover { background:rgba(59, 130, 246, 0.05); }
.list-row td { padding:14px 16px; border-bottom:1px solid #475569; font-size:13px; vertical-align:middle; color: #f1f5f9; }
.list-name-cell { display:flex; align-items:center; gap:10px; }
.list-file-icon { width:38px; height:38px; background:#1e293b; border-radius:10px; display:flex; align-items:center; justify-content:center; color:#3b82f6; font-size:16px; flex-shrink:0; border: 1px solid #334155; }
.list-cat-badge { display:inline-flex; align-items:center; gap:5px; font-size:11px; font-weight:600; padding:2px 10px; border-radius:20px; border:1px solid transparent; }
.list-cat-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
.tags-row { display:flex; gap:4px; flex-wrap:wrap; }
.page-badge { background:#1e293b; color:#94a3b8; border-radius:6px; padding:2px 10px; font-size:11px; font-weight:600; border: 1px solid #334155; }
.list-actions { display:flex; gap:6px; justify-content:flex-end; }
.action-btn { width:32px; height:32px; border:1px solid #1e293b; background:#1e293b; border-radius:8px; font-size:13px; color:#64748b; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; }
.action-btn:hover { background:#334155; color:#f8fafc; border-color: #475569; }
.action-btn.primary:hover { border-color:#3b82f6; color:#3b82f6; background:#3b82f615; }
.action-btn.success:hover { border-color:#10b981; color:#10b981; background:#10b98115; }
.action-btn.danger:hover { border-color:#ef4444; color:#ef4444; background:#ef444415; }
.tag-sm { font-size:10px; background:#1e293b; color:#94a3b8; border-radius:20px; padding:2px 10px; border: 1px solid #334155; }
.tag-more { font-size:10.5px; color:#94a3b8; padding:1px 4px; }
.card-desc { font-size:11px; color:#cbd5e1; line-height:1.4; margin-top:8px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; min-height:30px; }

/* Buttons */
.btn-primary-sm { display:inline-flex; align-items:center; gap:6px; background:linear-gradient(135deg, #3b82f6, #1d4ed8); color:white; border:none; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:all .2s linear; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
.btn-primary-sm:hover:not(:disabled) { background:linear-gradient(135deg, #2563eb, #1e40af); transform:translateY(-1.5px); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.3); }
.btn-primary-sm:disabled { opacity:.5; cursor:not-allowed; }
.btn-secondary-sm { display:inline-flex; align-items:center; gap:6px; background:#1e293b; color:#e2e8f0; border:1.5px solid #334155; border-radius:10px; padding:7px 15px; font-size:13px; font-weight:600; cursor:pointer; transition:all .15s; }
.btn-secondary-sm:hover { background:#334155; border-color:#475569; }
.btn-danger-sm { display:inline-flex; align-items:center; gap:6px; background:#ef4444; color:white; border:none; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:700; cursor:pointer; transition:all .18s; }
.btn-danger-sm:hover { background:#dc2626; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3); }
.btn-ghost { border:1.5px solid #1e293b; background:transparent; color:#94a3b8; border-radius:10px; padding:8px 16px; font-size:13px; font-weight:600; cursor:pointer; transition:all .2s; }
.btn-ghost:hover { background:#1e293b; color: #f1f5f9; border-color: #334155; }
.icon-btn { width:28px; height:28px; border:none; background:none; border-radius:7px; color:#64748b; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all .12s; }
.icon-btn:hover { background:#1e293b; color:#e2e8f0; }
.icon-btn-xs { width:22px; height:22px; border:none; background:none; border-radius:5px; color:#475569; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:11px; transition:all .12s; }
.icon-btn-xs:hover { background:#334155; color:#e2e8f0; }
.icon-btn-xs.danger:hover { background:#7f1d1d; color:#fca5a5; }

/* Modals */
.modal-bg { position:fixed; inset:0; background:rgba(15,23,42,.5); backdrop-filter:blur(3px); display:flex; align-items:center; justify-content:center; z-index:9999; animation:fade-in .15s ease; }
@keyframes fade-in { from{opacity:0} to{opacity:1} }
.modal-card { background:#0f172a; border-radius:20px; width:440px; max-width:95vw; max-height:90vh; display:flex; flex-direction:column; box-shadow:0 0 0 1px #334155, 0 32px 64px -16px rgba(0,0,0,0.6); overflow:hidden; animation:slide-up .2s cubic-bezier(.2, 1, .2, 1); border: 1px solid #334155; }
.modal-sm { width:380px; }
@keyframes slide-up { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
.modal-head { display:flex; align-items:center; justify-content:space-between; padding:20px 24px 16px; border-bottom:1px solid #334155; font-size:16px; font-weight:700; color:#f1f5f9; }
.danger-head { color:#f87171; }
.modal-body { padding:20px 24px; overflow-y:auto; flex:1; }
.modal-foot { display:flex; justify-content:flex-end; gap:10px; padding:16px 24px 20px; border-top:1px solid #334155; background: rgba(0, 0, 0, 0.2); }
.field-label { display:block; font-size:11px; font-weight:700; color:#64748b; margin-bottom:6px; text-transform: uppercase; letter-spacing: .05em; }
.field-input { width:100%; border:1.5px solid #1e293b; border-radius:10px; padding:10px 14px; font-size:14px; outline:none; transition:all .2s; box-sizing:border-box; background: #1f2937; color: #f1f5f9; }
.field-input:focus { border-color:#3b82f6; box-shadow:0 0 0 4px rgba(59,130,246,.15); background:#111827; }
.color-row { display:flex; gap:8px; flex-wrap:wrap; margin-top:4px; }
.color-btn { width:28px; height:28px; border-radius:50%; border:2.5px solid transparent; cursor:pointer; transition:transform .12s; }
.color-btn:hover { transform:scale(1.15); }
.color-btn.sel { border-color:#3b82f6; transform:scale(1.2); box-shadow:0 0 0 2px #111827, 0 0 0 4px #3b82f6; }
.cat-preview { margin-top:16px; display:flex; align-items:center; gap:8px; font-size:12px; color:#64748b; }
.tpl-name-badge { background:#1e293b; border-radius:10px; padding:10px 14px; font-size:14px; font-weight:600; color:#f1f5f9; display:flex; align-items:center; border: 1px solid #334155; }
.cat-select-list { display:flex; flex-direction:column; gap:6px; margin-bottom:2px; }
.cat-select-item { display:flex; align-items:center; gap:10px; padding:10px 14px; border-radius:10px; border:1.5px solid #1e293b; background:#111827; font-size:13px; color:#94a3b8; cursor:pointer; text-align:left; transition:all .2s; }
.cat-select-item:hover { background:#1e293b; border-color:#334155; color: #f1f5f9; }
.cat-select-item.sel { border-color:#3b82f6; background:#3b82f610; color:#3b82f6; font-weight:700; }
.tag-suggest { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:10px; }
.tag-sug-btn { border:1.5px solid #1e293b; background:#1e293b; color:#64748b; border-radius:20px; padding:3px 12px; font-size:11px; cursor:pointer; transition:all .15s; }
.tag-sug-btn:hover { border-color: #334155; color: #94a3b8; }
.tag-sug-btn.active { border-color:#3b82f6; color:white; background:#3b82f630; }

/* Utils */
.mt-1 { margin-top:4px; } .mt-2 { margin-top:8px; } .mt-3 { margin-top:12px; }
.me-1 { margin-right:4px; } .me-2 { margin-right:8px; }
.text-sm { font-size:12.5px; } .text-xs { font-size:11px; }
.text-muted { color:#94a3b8; } .text-primary { color:#1a56db; }
.text-muted-bright { color:#e2e8f0; }
.text-secondary-bright { color:#f8fafc; }
.fw600 { font-weight:600; }
.id-copy-row { display:flex; align-items:center; gap:8px; cursor:pointer; }
.id-badge-full { flex:1; background:rgba(0,0,0,0.3); border:1px solid #334155; border-radius:6px; padding:3px 10px; font-family:monospace; font-size:10px; color:white; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; transition:all .15s; }
.id-copy-row:hover .id-badge-full { border-color:#3b82f6; background:rgba(59, 130, 246, 0.1); }
.id-copy-btn { width:24px; height:24px; border:1px solid #334155; background:rgba(255,255,255,0.05); border-radius:6px; color:#94a3b8; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:12px; transition:all .15s; }
.id-copy-row:hover .id-copy-btn { border-color:#3b82f6; color:#3b82f6; background:#3b82f615; }
.id-badge-list { background:rgba(0,0,0,0.2); border:1px solid #475569; border-radius:4px; padding:1px 8px; font-family:monospace; font-size:10px; color:white; }
.clickable { cursor:pointer; }

/* modal error & spinner */
.modal-error { margin: 0 24px 10px; padding: 10px 16px; background: #450a0a; border: 1px solid #991b1b; border-radius: 10px; font-size: 12px; color: #f87171; display: flex; align-items: center; gap: 8px; }
.mini-spinner { display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.4); border-top-color: white; border-radius: 50%; animation: spin .6s linear infinite; margin-right: 4px; vertical-align: middle; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
