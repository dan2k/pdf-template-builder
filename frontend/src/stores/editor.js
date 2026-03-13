import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { templatesApi } from '../api'
import { v4 as uuidv4 } from '../utils/uuid'

export const defaultPageConfig = () => ({
  size: 'A4',
  orientation: 'portrait',
  marginTop: 40,
  marginBottom: 40,
  marginLeft: 40,
  marginRight: 40,
  backgroundColor: '#ffffff',
})

export const defaultPage = () => ({
  id: uuidv4(),
  config: defaultPageConfig(),
  elements: [],
})

export const useEditorStore = defineStore('editor', () => {
  const template = ref(null)
  const currentPageIndex = ref(0)
  const selectedElementId = ref(null)
  const isDirty = ref(false)
  const isSaving = ref(false)
  const history = ref([])
  const historyIndex = ref(-1)

  const currentPage = computed(() => template.value?.pages?.[currentPageIndex.value] || null)
  const selectedElement = computed(() => {
    if (!currentPage.value || !selectedElementId.value) return null
    return currentPage.value.elements.find(e => e.id === selectedElementId.value) || null
  })

  const pages = computed(() => template.value?.pages || [])

  function initNew() {
    template.value = {
      id: null,
      name: 'Untitled Template',
      description: '',
      category: null,
      tags: [],
      pages: [defaultPage()],
      variables: [],
    }
    currentPageIndex.value = 0
    selectedElementId.value = null
    isDirty.value = false
    history.value = []
    historyIndex.value = -1
    pushHistory()
  }

  function loadTemplate(t) {
    template.value = JSON.parse(JSON.stringify(t))
    if (!template.value.pages?.length) {
      template.value.pages = [defaultPage()]
    }
    // Parse globalHeaderFooter if it came as a string from API
    if (typeof template.value.globalHeaderFooter === 'string') {
      try { template.value.globalHeaderFooter = JSON.parse(template.value.globalHeaderFooter) }
      catch { template.value.globalHeaderFooter = null }
    }
    currentPageIndex.value = 0
    selectedElementId.value = null
    isDirty.value = false
    history.value = []
    historyIndex.value = -1
    pushHistory()
  }

  function pushHistory() {
    const snap = JSON.stringify(template.value?.pages)
    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1)
    }
    history.value.push(snap)
    if (history.value.length > 50) history.value.shift()
    historyIndex.value = history.value.length - 1
  }

  function undo() {
    if (historyIndex.value <= 0) return
    historyIndex.value--
    template.value.pages = JSON.parse(history.value[historyIndex.value])
    selectedElementId.value = null
    isDirty.value = true
  }

  function redo() {
    if (historyIndex.value >= history.value.length - 1) return
    historyIndex.value++
    template.value.pages = JSON.parse(history.value[historyIndex.value])
    isDirty.value = true
  }

  function markDirty() {
    isDirty.value = true
    pushHistory()
  }

  // Page operations
  function addPage() {
    template.value.pages.push(defaultPage())
    currentPageIndex.value = template.value.pages.length - 1
    selectedElementId.value = null
    markDirty()
  }

  function removePage(index) {
    if (template.value.pages.length <= 1) return
    template.value.pages.splice(index, 1)
    if (currentPageIndex.value >= template.value.pages.length) {
      currentPageIndex.value = template.value.pages.length - 1
    }
    selectedElementId.value = null
    markDirty()
  }

  function duplicatePage(index) {
    const copy = JSON.parse(JSON.stringify(template.value.pages[index]))
    copy.id = uuidv4()
    copy.elements = copy.elements.map(e => ({ ...e, id: uuidv4() }))
    template.value.pages.splice(index + 1, 0, copy)
    currentPageIndex.value = index + 1
    markDirty()
  }

  function updatePageConfig(config) {
    if (!currentPage.value) return
    currentPage.value.config = { ...currentPage.value.config, ...config }
    markDirty()
  }

  // Element operations
  function addElement(element) {
    if (!currentPage.value) return
    const el = { id: uuidv4(), zIndex: currentPage.value.elements.length, ...element }
    currentPage.value.elements.push(el)
    selectedElementId.value = el.id
    markDirty()
    return el
  }

  function updateElement(id, updates) {
    if (!currentPage.value) return
    const idx = currentPage.value.elements.findIndex(e => e.id === id)
    if (idx === -1) return
    currentPage.value.elements[idx] = { ...currentPage.value.elements[idx], ...updates }
    isDirty.value = true
  }

  function updateElementAndHistory(id, updates) {
    updateElement(id, updates)
    pushHistory()
  }

  function removeElement(id) {
    if (!currentPage.value) return
    const idx = currentPage.value.elements.findIndex(e => e.id === id)
    if (idx !== -1) currentPage.value.elements.splice(idx, 1)
    if (selectedElementId.value === id) selectedElementId.value = null
    markDirty()
  }

  function selectElement(id) {
    selectedElementId.value = id
  }

  function bringForward(id) {
    const el = currentPage.value?.elements.find(e => e.id === id)
    if (el) { el.zIndex = (el.zIndex || 0) + 1; markDirty() }
  }

  function sendBackward(id) {
    const el = currentPage.value?.elements.find(e => e.id === id)
    if (el) { el.zIndex = Math.max(0, (el.zIndex || 0) - 1); markDirty() }
  }

  function duplicateElement(id) {
    if (!currentPage.value) return
    const el = currentPage.value.elements.find(e => e.id === id)
    if (!el) return
    const copy = JSON.parse(JSON.stringify(el))
    copy.id = uuidv4()
    copy.x += 10
    copy.y += 10
    currentPage.value.elements.push(copy)
    selectedElementId.value = copy.id
    markDirty()
  }

  // Save
  async function save() {
    if (!template.value) return
    isSaving.value = true
    try {
      const payload = {
        name:              template.value.name,
        description:       template.value.description,
        category:          template.value.category || null,
        tags:              template.value.tags || [],
        pages:             template.value.pages,
        variables:         template.value.variables,
        globalHeaderFooter: template.value.globalHeaderFooter,
      }
      if (template.value.id) {
        const res = await templatesApi.update(template.value.id, payload)
        template.value.id = res.data.id
      } else {
        const res = await templatesApi.create(payload)
        template.value.id = res.data.id
      }
      isDirty.value = false
    } finally {
      isSaving.value = false
    }
  }

  // Quick-save only meta fields (category/tags/name/description) — no page payload
  async function saveMeta() {
    if (!template.value?.id) return
    try {
      await templatesApi.update(template.value.id, {
        name:        template.value.name,
        description: template.value.description || '',
        category:    template.value.category || null,
        tags:        template.value.tags || [],
      })
    } catch(e) { console.error('saveMeta failed', e) }
  }

  // ── Multi-select state ────────────────────────────────────────────────────
  const selectedIds = ref([])   // ids of multi-selected elements

  function selectMulti(ids) {
    selectedIds.value = ids || []
  }

  // ── Group: wrap selected elements into a group element ────────────────────
  function groupElements(ids) {
    if (!currentPage.value || ids.length < 2) return
    const els = currentPage.value.elements.filter(e => ids.includes(e.id))
    if (!els.length) return

    const x1 = Math.min(...els.map(e => e.x))
    const y1 = Math.min(...els.map(e => e.y))
    const x2 = Math.max(...els.map(e => e.x + e.width))
    const y2 = Math.max(...els.map(e => e.y + e.height))

    // Adjust children positions relative to group origin
    const children = els.map(e => ({ ...JSON.parse(JSON.stringify(e)), x: e.x - x1, y: e.y - y1 }))

    // Remove originals
    currentPage.value.elements = currentPage.value.elements.filter(e => !ids.includes(e.id))

    // Add group element
    const group = {
      id: uuidv4(),
      type: 'group',
      x: x1, y: y1,
      width:  x2 - x1,
      height: y2 - y1,
      children,
      zIndex: Math.max(...els.map(e => e.zIndex || 0)),
      label: 'Group',
    }
    currentPage.value.elements.push(group)
    selectedElementId.value = group.id
    selectedIds.value = []
    pushHistory()
    markDirty()
  }

  // ── Ungroup: expand group children back to page ───────────────────────────
  function ungroupElement(id) {
    if (!currentPage.value) return
    const idx = currentPage.value.elements.findIndex(e => e.id === id)
    if (idx === -1) return
    const group = currentPage.value.elements[idx]
    if (group.type !== 'group' || !group.children?.length) return

    const newEls = group.children.map(c => ({
      ...c,
      id: uuidv4(),
      x: group.x + c.x,
      y: group.y + c.y,
    }))
    currentPage.value.elements.splice(idx, 1, ...newEls)
    selectedIds.value = newEls.map(e => e.id)
    selectedElementId.value = newEls[0]?.id || null
    pushHistory()
    markDirty()
  }

  return {
    template, currentPageIndex, selectedElementId, selectedIds, isDirty, isSaving,
    currentPage, selectedElement, pages,
    history, historyIndex,
    initNew, loadTemplate, markDirty,
    undo, redo,
    addPage, removePage, duplicatePage, updatePageConfig,
    addElement, updateElement, updateElementAndHistory, removeElement,
    selectElement, selectMulti, bringForward, sendBackward, duplicateElement,
    groupElements, ungroupElement,
    save, saveMeta,
  }
})
