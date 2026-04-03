<template>
  <div class="element-props">
    <!-- Header -->
    <div class="props-header">
      <div class="d-flex align-items-center gap-2">
        <div class="el-type-badge" :class="'type-' + element.type">
          <i :class="typeIcon"></i>
        </div>
        <span class="fw-semibold text-capitalize">{{ element.type }}</span>
      </div>
      <div class="d-flex gap-1">
        <button class="toolbar-btn" @click="$emit('bring-forward')" title="Bring Forward"><i class="bi bi-layers-forward"></i></button>
        <button class="toolbar-btn" @click="$emit('send-backward')" title="Send Backward"><i class="bi bi-layers-backward"></i></button>
        <button class="toolbar-btn" @click="$emit('duplicate')" title="Duplicate"><i class="bi bi-copy"></i></button>
        <button class="toolbar-btn text-danger" @click="$emit('delete')" title="Delete"><i class="bi bi-trash"></i></button>
      </div>
    </div>

    <!-- Position & Size -->
    <div class="panel-section">
      <div class="panel-section-title">Position & Size</div>
      <div class="row g-2">
        <div class="col-6"><label class="tiny-label">X</label><input type="number" class="form-control form-control-sm" :value="element.x" @change="update('x', +$event.target.value)" /></div>
        <div class="col-6"><label class="tiny-label">Y</label><input type="number" class="form-control form-control-sm" :value="element.y" @change="update('y', +$event.target.value)" /></div>
        <div class="col-6"><label class="tiny-label">Width</label><input type="number" class="form-control form-control-sm" :value="element.width" @change="update('width', +$event.target.value)" min="10" /></div>
        <div class="col-6"><label class="tiny-label">Height</label><input type="number" class="form-control form-control-sm" :value="element.height" @change="update('height', +$event.target.value)" min="5" /></div>
      </div>
    </div>

    <!-- Appearance: Opacity / Rotation / Label -->
    <div class="panel-section">
      <div class="panel-section-title">Appearance</div>
      <div class="prop-row">
        <label class="prop-label">Opacity</label>
        <div class="d-flex gap-2 align-items-center">
          <input type="range" class="form-range" style="flex:1" min="0" max="1" step="0.05"
            :value="element.opacity??1" @input="update('opacity',+$event.target.value)" />
          <span style="font-size:11px;width:32px;text-align:right">{{ Math.round((element.opacity??1)*100) }}%</span>
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">ชื่อ Layer</label>
        <input type="text" class="form-control form-control-sm prop-control" :value="element.label||''" @change="update('label',$event.target.value)" placeholder="ไม่บังคับ" />
      </div>
      <div class="prop-row">
        <label class="prop-label">ซ่อน</label>
        <div class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" :checked="element.hidden" @change="update('hidden',$event.target.checked)" />
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">ล็อก</label>
        <div class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" :checked="element.locked" @change="update('locked',$event.target.checked)" />
        </div>
      </div>
    </div>

    <!-- ═══ TEXT ELEMENT ═══════════════════════════════════════════════ -->
    <template v-if="element.type === 'text'">
      <div class="panel-section">
        <div class="panel-section-title d-flex align-items-center justify-content-between">
          <span>Content</span>
          <div class="form-check form-switch mb-0" style="padding-left:2.5em">
            <input class="form-check-input" type="checkbox" :checked="element.richMode" @change="update('richMode', $event.target.checked)" id="richModeToggle" />
            <label class="form-check-label" for="richModeToggle" style="font-size:10px;color:var(--gray-500)">Rich Text</label>
          </div>
        </div>

        <!-- Plain text mode -->
        <template v-if="!element.richMode">
          <textarea class="form-control form-control-sm" rows="3"
            :value="element.content"
            @input="update('content', $event.target.value)"
            placeholder="Text content..."></textarea>
          <small class="text-muted mt-1 d-block">ใช้ <code>&#123;&#123;variable&#125;&#125;</code> สำหรับข้อมูลแบบ dynamic</small>
        </template>

        <!-- Rich text mode -->
        <template v-if="element.richMode">
          <RichTextEditor :modelValue="element.richContent || []" @update:modelValue="update('richContent', $event)" />
          <small class="text-muted mt-1 d-block">ใช้ <code>&#123;&#123;variable&#125;&#125;</code> ใน text ได้เช่นกัน</small>
        </template>

        <div class="prop-row mt-2">
          <label class="prop-label">Binding Key</label>
          <input type="text" class="form-control form-control-sm prop-control" :value="element.bindingKey||''" @change="update('bindingKey',$event.target.value)" placeholder="ไม่บังคับ" />
        </div>
      </div>

      <!-- Typography (Word-like) -->
      <div class="panel-section">
        <div class="panel-section-title">Typography</div>

        <!-- Font Family -->
        <div class="mb-2">
          <label class="tiny-label">Font Family</label>
          <div class="font-dropdown-wrap" ref="fontDropRef">
            <button class="font-trigger" @click="toggleFontDrop" :style="{ fontFamily: cssFontFamily }">
              <span class="font-trigger-name">{{ currentFontName }}</span>
              <i class="bi bi-chevron-down" style="font-size:9px;opacity:.5;flex-shrink:0"></i>
            </button>
            <div v-if="fontDropOpen" class="font-dropdown-panel">
              <div class="font-search-row">
                <i class="bi bi-search"></i>
                <input ref="fontSearchRef" v-model="fontSearch" placeholder="ค้นหา font..." @click.stop />
              </div>
              <template v-if="thaiFonts.length">
                <div class="font-group-label"><i class="bi bi-globe-asia-australia me-1"></i>ภาษาไทย</div>
                <div v-for="f in thaiFonts" :key="f.key"
                  class="font-opt" :class="{ active: element.fontFamily === f.key }"
                  @click="applyFont(f.key)">
                  <span class="font-opt-name">{{ f.name }}</span>
                  <span class="font-opt-preview" :style="{ fontFamily: f.cssFamily }">สวัสดี Aa</span>
                </div>
              </template>
              <template v-if="latinFonts.length">
                <div class="font-group-label"><i class="bi bi-fonts me-1"></i>Latin</div>
                <div v-for="f in latinFonts" :key="f.key"
                  class="font-opt" :class="{ active: element.fontFamily === f.key }"
                  @click="applyFont(f.key)">
                  <span class="font-opt-name">{{ f.name }}</span>
                  <span class="font-opt-preview" :style="{ fontFamily: f.cssFamily }">Quick fox</span>
                </div>
              </template>
              <div v-if="!thaiFonts.length && !latinFonts.length" class="p-3 text-center text-muted" style="font-size:12px">ไม่พบ font</div>
            </div>
          </div>
        </div>

        <!-- Font Size + Color row -->
        <div class="d-flex gap-2 mb-2 align-items-end">
          <div style="flex:1">
            <label class="tiny-label">ขนาด (px)</label>
            <div class="size-spin">
              <button @click="update('fontSize', Math.max(6,(element.fontSize||12)-1))">−</button>
              <input type="number" :value="element.fontSize||12" @change="update('fontSize',+$event.target.value)" min="6" max="200" />
              <button @click="update('fontSize', Math.min(200,(element.fontSize||12)+1))">+</button>
            </div>
          </div>
          <div>
            <label class="tiny-label">สี</label>
            <div class="color-pick-row">
              <input type="color" class="color-swatch" :value="element.color||'#000000'" @input="update('color',$event.target.value)" />
              <input type="text" class="form-control form-control-sm" style="width:72px;font-size:11px;font-family:monospace" :value="element.color||'#000000'" @change="update('color',$event.target.value)" />
            </div>
          </div>
        </div>

        <!-- Style buttons row -->
        <div class="style-row mb-2">
          <button class="sty-btn" :class="{ active: element.fontWeight==='bold' }"
            @click="update('fontWeight', element.fontWeight==='bold'?'normal':'bold')" title="Bold"><b>B</b></button>
          <button class="sty-btn" :class="{ active: element.fontStyle==='italic' }"
            @click="update('fontStyle', element.fontStyle==='italic'?'normal':'italic')" title="Italic"><i>I</i></button>
          <button class="sty-btn" :class="{ active: element.textDecoration==='underline' }"
            @click="toggleDeco('underline')" title="Underline"><span style="text-decoration:underline">U</span></button>
          <button class="sty-btn" :class="{ active: element.textDecoration==='line-through' }"
            @click="toggleDeco('line-through')" title="Strikethrough"><span style="text-decoration:line-through">S</span></button>
          <div class="sty-sep"></div>
          <button class="sty-btn" :class="{ active: (element.align||'left')==='left' }"    @click="update('align','left')"    title="จัดซ้าย"><i class="bi bi-text-left"></i></button>
          <button class="sty-btn" :class="{ active: element.align==='center' }"             @click="update('align','center')"  title="กลาง"><i class="bi bi-text-center"></i></button>
          <button class="sty-btn" :class="{ active: element.align==='right' }"              @click="update('align','right')"   title="จัดขวา"><i class="bi bi-text-right"></i></button>
          <button class="sty-btn" :class="{ active: element.align==='justify' }"            @click="update('align','justify')" title="ชิดขอบ"><i class="bi bi-justify"></i></button>
        </div>

        <!-- Line Height + Indent + Padding -->
        <div class="d-flex gap-2">
          <div style="flex:1">
            <label class="tiny-label">Line Height</label>
            <select class="form-select form-select-sm" :value="element.lineHeight||1.4" @change="update('lineHeight',+$event.target.value)">
              <option value="1">1.0</option><option value="1.15">1.15</option><option value="1.4">1.4</option>
              <option value="1.5">1.5</option><option value="1.75">1.75</option><option value="2">2.0</option>
            </select>
          </div>
          <div style="flex:1">
            <label class="tiny-label">Indent (px)</label>
            <input type="number" class="form-control form-control-sm" :value="element.indent||0" @change="update('indent',+$event.target.value)" min="0" max="120" />
          </div>
        </div>
      </div>

      <!-- Background & Border -->
      <div class="panel-section">
        <div class="panel-section-title">Background & Border</div>
        <div class="prop-row">
          <label class="prop-label">BG Color</label>
          <div class="d-flex gap-2 align-items-center">
            <input type="color" class="color-swatch" :value="element.backgroundColor&&element.backgroundColor!=='transparent'?element.backgroundColor:'#ffffff'" @input="update('backgroundColor',$event.target.value)" />
            <button class="btn btn-xs btn-outline-secondary" @click="update('backgroundColor','transparent')">None</button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Padding</label>
          <input type="number" class="form-control form-control-sm prop-control" :value="element.padding||0" @change="update('padding',+$event.target.value)" min="0" />
        </div>
        <div class="prop-row">
          <label class="prop-label">Border</label>
          <div class="d-flex gap-2 align-items-center">
            <input type="color" class="color-swatch" :value="element.borderColor||'#cccccc'" @input="update('borderColor',$event.target.value)" />
            <input type="number" class="form-control form-control-sm" :value="element.borderWidth||0" @change="update('borderWidth',+$event.target.value)" min="0" max="20" style="width:60px" />
          </div>
        </div>
      </div>
    </template>

    <!-- Advanced Typography (text only) -->
    <template v-if="element.type === 'text'">
    <div class="panel-section">
      <div class="panel-section-title">Advanced (PDFKit)</div>
      <div class="prop-row">
        <label class="prop-label">Char Spacing</label>
        <input type="number" class="form-control form-control-sm prop-control" :value="element.characterSpacing||0" @change="update('characterSpacing',+$event.target.value)" step="0.5" min="-10" max="40" />
      </div>
      <div class="prop-row">
        <label class="prop-label">Word Spacing</label>
        <input type="number" class="form-control form-control-sm prop-control" :value="element.wordSpacing||0" @change="update('wordSpacing',+$event.target.value)" step="0.5" min="0" max="40" />
      </div>
      <div class="prop-row">
        <label class="prop-label">Para Gap</label>
        <input type="number" class="form-control form-control-sm prop-control" :value="element.paragraphGap||0" @change="update('paragraphGap',+$event.target.value)" min="0" max="60" />
      </div>
      <div class="prop-row">
        <label class="prop-label">Border Radius</label>
        <input type="number" class="form-control form-control-sm prop-control" :value="element.borderRadius||0" @change="update('borderRadius',+$event.target.value)" min="0" max="100" />
      </div>
      <div class="prop-row">
        <label class="prop-label">Padding T/R/B/L</label>
        <div class="d-flex gap-1">
          <input type="number" class="form-control form-control-sm" style="width:44px" placeholder="T" :value="element.paddingTop??element.padding??0" @change="update('paddingTop',+$event.target.value)" min="0" />
          <input type="number" class="form-control form-control-sm" style="width:44px" placeholder="R" :value="element.paddingRight??element.padding??0" @change="update('paddingRight',+$event.target.value)" min="0" />
          <input type="number" class="form-control form-control-sm" style="width:44px" placeholder="B" :value="element.paddingBottom??element.padding??0" @change="update('paddingBottom',+$event.target.value)" min="0" />
          <input type="number" class="form-control form-control-sm" style="width:44px" placeholder="L" :value="element.paddingLeft??element.padding??0" @change="update('paddingLeft',+$event.target.value)" min="0" />
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">Ellipsis</label>
        <div class="form-check form-switch mb-0">
          <input class="form-check-input" type="checkbox" :checked="element.ellipsis" @change="update('ellipsis',$event.target.checked)" />
        </div>
      </div>
      <div class="prop-row">
        <label class="prop-label">Link URL</label>
        <input type="text" class="form-control form-control-sm prop-control" :value="element.link||''" @change="update('link',$event.target.value)" placeholder="https://..." />
      </div>
    </div>
    </template>

    <!-- ═══ IMAGE ELEMENT ═══════════════════════════════════════════════ -->
    <template v-if="element.type === 'image'">
      <div class="panel-section">
        <div class="panel-section-title">Image Source</div>

        <!-- Mode switcher -->
        <div class="img-mode-tabs mb-3">
          <button class="img-mode-btn" :class="{ active: imgMode === 'static' }" @click="imgMode = 'static'">
            <i class="bi bi-image me-1"></i>Static
          </button>
          <button class="img-mode-btn" :class="{ active: imgMode === 'variable' }" @click="imgMode = 'variable'">
            <i class="bi bi-link-45deg me-1"></i>Variable (base64)
          </button>
        </div>

        <!-- Static mode -->
        <template v-if="imgMode === 'static'">
          <div class="mb-2">
            <label class="tiny-label">URL</label>
            <input type="text" class="form-control form-control-sm" :value="element.src" @change="update('src',$event.target.value)" placeholder="https://example.com/image.png" />
          </div>
          <div class="mb-2">
            <label class="tiny-label">Upload File</label>
            <input type="file" class="form-control form-control-sm" accept="image/*" @change="uploadImage" />
          </div>
          <div v-if="element.src" class="img-preview-wrap">
            <img :src="element.src" class="img-preview" @error="$event.target.style.display='none'" />
          </div>
        </template>

        <!-- Variable mode -->
        <template v-if="imgMode === 'variable'">
          <div class="mb-2">
            <label class="tiny-label">Variable Name</label>
            <div class="input-group input-group-sm">
              <span class="input-group-text" style="font-family:monospace;font-size:11px">&#123;&#123;</span>
              <input type="text" class="form-control form-control-sm" style="font-family:monospace"
                :value="element.bindingKey||''"
                @change="update('bindingKey',$event.target.value)"
                placeholder="imageData" />
              <span class="input-group-text" style="font-family:monospace;font-size:11px">&#125;&#125;</span>
            </div>
          </div>
          <div class="base64-info">
            <i class="bi bi-info-circle me-1"></i>
            <span>ส่งค่าเป็น base64 string ใน JSON input</span>
          </div>
          <div class="base64-example mt-2">
            <div class="tiny-label mb-1">ตัวอย่าง JSON input:</div>
            <pre class="code-block">{{ base64ExampleJson }}</pre>
          </div>
          <!-- Test base64 paste -->
          <div class="mt-2">
            <label class="tiny-label">ทดสอบ: วาง base64 เพื่อ preview</label>
            <textarea class="form-control form-control-sm" rows="3" v-model="testBase64"
              placeholder="วาง base64 string หรือ data:image/... ที่นี่เพื่อดู preview..." style="font-size:10px;font-family:monospace"></textarea>
            <div v-if="testBase64" class="img-preview-wrap mt-2">
              <img :src="normalizeBase64(testBase64)" class="img-preview"
                @error="$event.target.src=''; $event.target.style.display='none'" />
            </div>
          </div>
        </template>

        <div class="prop-row mt-2">
          <label class="prop-label">Object Fit</label>
          <select class="form-select form-select-sm prop-control" :value="element.objectFit" @change="update('objectFit',$event.target.value)">
            <option value="contain">Contain</option><option value="cover">Cover</option><option value="fill">Fill</option>
          </select>
        </div>
      </div>
    </template>

    <!-- ═══ TABLE ELEMENT ═══════════════════════════════════════════════ -->
    <template v-if="element.type === 'table'">
      <div class="panel-section">
        <div class="panel-section-title">Data Source</div>
        <!-- Mode toggle -->
        <div class="d-flex gap-2 mb-2">
          <button class="btn btn-xs" :class="element.dataKey ? 'btn-primary' : 'btn-outline-secondary'" @click="update('dataKey', element.dataKey || 'items')">
            <i class="bi bi-link-45deg me-1"></i>Dynamic
          </button>
          <button class="btn btn-xs" :class="!element.dataKey ? 'btn-primary' : 'btn-outline-secondary'" @click="update('dataKey', '')">
            <i class="bi bi-pencil-square me-1"></i>Static
          </button>
        </div>

        <!-- Dynamic mode -->
        <template v-if="element.dataKey">
          <div class="prop-row">
            <label class="prop-label">Data Key</label>
            <input type="text" class="form-control form-control-sm prop-control" :value="element.dataKey" @change="update('dataKey',$event.target.value)" placeholder="items" />
          </div>
          <small class="text-muted">เช่น <code>items</code> หรือ <code>order.lines</code></small>
        </template>

        <!-- Static mode -->
        <template v-if="!element.dataKey">
          <div class="static-rows-editor">
            <div class="d-flex align-items-center justify-content-between mb-1">
              <small class="text-muted fw-semibold">Static Rows ({{ (element.staticRows || []).length }})</small>
              <button class="btn btn-xs btn-outline-primary" @click="addStaticRow"><i class="bi bi-plus"></i> Row</button>
            </div>
            <div class="static-rows-list">
              <div v-for="(row, ri) in (element.staticRows || [])" :key="ri" class="static-row-item">
                <div class="d-flex align-items-center gap-1 mb-1">
                  <span class="col-num">{{ ri + 1 }}</span>
                  <button class="btn btn-xs btn-outline-danger ms-auto" @click="removeStaticRow(ri)"><i class="bi bi-x"></i></button>
                </div>
                <div class="d-flex flex-wrap gap-1">
                  <div v-for="col in element.columns" :key="col.key" style="flex:1;min-width:60px">
                    <label style="font-size:9px;color:var(--gray-400)">{{ col.label || col.key }}</label>
                    <input type="text" class="form-control form-control-sm" style="font-size:10px"
                      :value="row[col.key] || ''" @change="updateStaticCell(ri, col.key, $event.target.value)" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="panel-section">
        <div class="panel-section-title">Columns</div>
        <div v-for="(col, i) in element.columns" :key="i" class="col-editor mb-2">
          <div class="d-flex gap-1 align-items-center mb-1">
            <span class="col-num">{{ i+1 }}</span>
            <input type="text" class="form-control form-control-sm" :value="col.label" @change="updateCol(i,'label',$event.target.value)" placeholder="Label" />
            <button class="btn btn-xs btn-outline-danger" @click="removeCol(i)"><i class="bi bi-x"></i></button>
          </div>
          <div class="d-flex gap-1">
            <input type="text" class="form-control form-control-sm" :value="col.key" @change="updateCol(i,'key',$event.target.value)" placeholder="Key" />
            <input type="number" class="form-control form-control-sm" style="width:55px" :value="col.width||''" @change="updateCol(i,'width',+$event.target.value)" placeholder="%" title="Width %" />
            <select class="form-select form-select-sm" style="width:60px" :value="col.align||'left'" @change="updateCol(i,'align',$event.target.value)">
              <option value="left">L</option><option value="center">C</option><option value="right">R</option>
            </select>
          </div>
        </div>
        <button class="btn btn-sm btn-outline-primary w-100 mt-1" @click="addCol"><i class="bi bi-plus me-1"></i>Add Column</button>
      </div>

      <!-- ── HEADER section ── -->
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="bi bi-layout-text-window-reverse me-1" style="color:#1a56db"></i>Header Style
        </div>
        <!-- Header BG + Text color -->
        <div class="prop-row">
          <label class="prop-label">Background</label>
          <input type="color" class="color-swatch" :value="element.headerBgColor||'#1a56db'" @input="update('headerBgColor',$event.target.value)" />
        </div>
        <div class="prop-row">
          <label class="prop-label">Text Color</label>
          <input type="color" class="color-swatch" :value="element.headerTextColor||'#ffffff'" @input="update('headerTextColor',$event.target.value)" />
        </div>
        <!-- Header font -->
        <div class="mb-2">
          <label class="tiny-label">Font Family</label>
          <div class="font-dropdown-wrap" ref="tableHdrFontDropRef">
            <button class="font-trigger" @click="toggleTableHdrFontDrop" :style="{ fontFamily: tableHdrCssFontFamily }">
              <span class="font-trigger-name">{{ tableHdrCurrentFontName }}</span>
              <i class="bi bi-chevron-down" style="font-size:9px;opacity:.5;flex-shrink:0"></i>
            </button>
            <div v-if="tableHdrFontDropOpen" class="font-dropdown-panel">
              <div class="font-search-row"><i class="bi bi-search"></i><input ref="tableHdrFontSearchRef" v-model="tableHdrFontSearch" placeholder="ค้นหา font..." @click.stop /></div>
              <template v-if="tableHdrThaiFiltered.length">
                <div class="font-group-label"><i class="bi bi-globe-asia-australia me-1"></i>ภาษาไทย</div>
                <div v-for="f in tableHdrThaiFiltered" :key="f.key" class="font-opt" :class="{ active: (element.headerFontFamily||element.fontFamily)===f.key }" @click="applyTableHdrFont(f.key)">
                  <span class="font-opt-name">{{ f.name }}</span><span class="font-opt-preview" :style="{fontFamily:f.cssFamily}">สวัสดี Aa</span>
                </div>
              </template>
              <template v-if="tableHdrLatinFiltered.length">
                <div class="font-group-label"><i class="bi bi-fonts me-1"></i>Latin</div>
                <div v-for="f in tableHdrLatinFiltered" :key="f.key" class="font-opt" :class="{ active: (element.headerFontFamily||element.fontFamily)===f.key }" @click="applyTableHdrFont(f.key)">
                  <span class="font-opt-name">{{ f.name }}</span><span class="font-opt-preview" :style="{fontFamily:f.cssFamily}">Quick fox</span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <!-- Header font size + weight + align -->
        <div class="prop-row">
          <label class="prop-label">Font Size</label>
          <div class="size-spin" style="max-width:110px">
            <button @click="update('headerFontSize',Math.max(6,(element.headerFontSize||element.fontSize||11)-1))">−</button>
            <input type="number" :value="element.headerFontSize||element.fontSize||11" @change="update('headerFontSize',+$event.target.value)" min="6" max="36" />
            <button @click="update('headerFontSize',Math.min(36,(element.headerFontSize||element.fontSize||11)+1))">+</button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Weight</label>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{active:(element.headerFontWeight||'bold')==='bold'}" @click="update('headerFontWeight','bold')"><b>B</b></button>
            <button class="btn btn-outline-secondary" :class="{active:(element.headerFontWeight||'bold')==='normal'}" @click="update('headerFontWeight','normal')">N</button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Align</label>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{active:(element.headerAlign||'left')==='left'}"   @click="update('headerAlign','left')"><i class="bi bi-text-left"></i></button>
            <button class="btn btn-outline-secondary" :class="{active:(element.headerAlign||'left')==='center'}" @click="update('headerAlign','center')"><i class="bi bi-text-center"></i></button>
            <button class="btn btn-outline-secondary" :class="{active:(element.headerAlign||'left')==='right'}"  @click="update('headerAlign','right')"><i class="bi bi-text-right"></i></button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Cell Padding</label>
          <input type="number" class="form-control form-control-sm prop-control" :value="element.headerPadding||element.cellPadding||6" @change="update('headerPadding',+$event.target.value)" min="0" max="30" />
        </div>
      </div>

      <!-- ── BODY section ── -->
      <div class="panel-section">
        <div class="panel-section-title">
          <i class="bi bi-table me-1" style="color:#374151"></i>Body Style
        </div>
        <div class="prop-row"><label class="prop-label">Row BG</label><input type="color" class="color-swatch" :value="element.rowBgColor||'#ffffff'" @input="update('rowBgColor',$event.target.value)" /></div>
        <div class="prop-row">
          <label class="prop-label">Alt Row BG</label>
          <div class="d-flex gap-2">
            <input type="color" class="color-swatch" :value="element.altRowBgColor||'#f9fafb'" @input="update('altRowBgColor',$event.target.value)" />
            <button class="btn btn-xs btn-outline-secondary" @click="update('altRowBgColor','')">None</button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Text Color</label>
          <input type="color" class="color-swatch" :value="element.rowTextColor||'#111827'" @input="update('rowTextColor',$event.target.value)" />
        </div>
        <!-- Body font -->
        <div class="mb-2">
          <label class="tiny-label">Font Family</label>
          <div class="font-dropdown-wrap" ref="tableFontDropRef">
            <button class="font-trigger" @click="toggleTableFontDrop" :style="{ fontFamily: tableCssFontFamily }">
              <span class="font-trigger-name">{{ tableCurrentFontName }}</span>
              <i class="bi bi-chevron-down" style="font-size:9px;opacity:.5;flex-shrink:0"></i>
            </button>
            <div v-if="tableFontDropOpen" class="font-dropdown-panel">
              <div class="font-search-row"><i class="bi bi-search"></i><input ref="tableFontSearchRef" v-model="tableFontSearch" placeholder="ค้นหา font..." @click.stop /></div>
              <template v-if="tableThaiFiltered.length">
                <div class="font-group-label"><i class="bi bi-globe-asia-australia me-1"></i>ภาษาไทย</div>
                <div v-for="f in tableThaiFiltered" :key="f.key" class="font-opt" :class="{ active: element.fontFamily===f.key }" @click="applyTableFont(f.key)">
                  <span class="font-opt-name">{{ f.name }}</span><span class="font-opt-preview" :style="{fontFamily:f.cssFamily}">สวัสดี Aa</span>
                </div>
              </template>
              <template v-if="tableLatinFiltered.length">
                <div class="font-group-label"><i class="bi bi-fonts me-1"></i>Latin</div>
                <div v-for="f in tableLatinFiltered" :key="f.key" class="font-opt" :class="{ active: element.fontFamily===f.key }" @click="applyTableFont(f.key)">
                  <span class="font-opt-name">{{ f.name }}</span><span class="font-opt-preview" :style="{fontFamily:f.cssFamily}">Quick fox</span>
                </div>
              </template>
            </div>
          </div>
        </div>
        <!-- Body font size + weight + align -->
        <div class="prop-row">
          <label class="prop-label">Font Size</label>
          <div class="size-spin" style="max-width:110px">
            <button @click="update('fontSize',Math.max(6,(element.fontSize||11)-1))">−</button>
            <input type="number" :value="element.fontSize||11" @change="update('fontSize',+$event.target.value)" min="6" max="36" />
            <button @click="update('fontSize',Math.min(36,(element.fontSize||11)+1))">+</button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Weight</label>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{active:(element.bodyFontWeight||'normal')==='bold'}"   @click="update('bodyFontWeight','bold')"><b>B</b></button>
            <button class="btn btn-outline-secondary" :class="{active:(element.bodyFontWeight||'normal')==='normal'}" @click="update('bodyFontWeight','normal')">N</button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Align (default)</label>
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-secondary" :class="{active:(element.bodyAlign||'left')==='left'}"   @click="update('bodyAlign','left')"><i class="bi bi-text-left"></i></button>
            <button class="btn btn-outline-secondary" :class="{active:(element.bodyAlign||'left')==='center'}" @click="update('bodyAlign','center')"><i class="bi bi-text-center"></i></button>
            <button class="btn btn-outline-secondary" :class="{active:(element.bodyAlign||'left')==='right'}"  @click="update('bodyAlign','right')"><i class="bi bi-text-right"></i></button>
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Cell Padding</label>
          <input type="number" class="form-control form-control-sm prop-control" :value="element.cellPadding||6" @change="update('cellPadding',+$event.target.value)" min="0" max="30" />
        </div>
      </div>

      <!-- ── BORDER section ── -->
      <div class="panel-section">
        <div class="panel-section-title"><i class="bi bi-border-all me-1"></i>Border</div>
        <div class="prop-row">
          <label class="prop-label">Outer</label>
          <div class="d-flex gap-2">
            <input type="color" class="color-swatch" :value="element.borderColor||'#e5e7eb'" @input="update('borderColor',$event.target.value)" />
            <input type="number" class="form-control form-control-sm" style="width:60px" :value="element.borderWidth||1" @change="update('borderWidth',+$event.target.value)" min="0" max="5" />
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Inner</label>
          <div class="d-flex gap-2">
            <input type="color" class="color-swatch" :value="element.innerBorderColor||element.borderColor||'#e5e7eb'" @input="update('innerBorderColor',$event.target.value)" />
            <input type="number" class="form-control form-control-sm" style="width:60px" :value="element.innerBorderWidth!=null?element.innerBorderWidth:(element.borderWidth||1)" @change="update('innerBorderWidth',+$event.target.value)" min="0" max="5" />
          </div>
        </div>
        <div class="form-check form-switch mt-2">
          <input class="form-check-input" type="checkbox" :checked="element.repeatHeaderOnNewPage" @change="update('repeatHeaderOnNewPage',$event.target.checked)" id="rph" />
          <label class="form-check-label" for="rph" style="font-size:12px">Repeat header on new page</label>
        </div>
      </div>
    </template>

    <!-- ═══ SHAPE ELEMENT ═══════════════════════════════════════════════ -->
    <template v-if="element.type === 'shape'">
      <div class="panel-section">
        <div class="panel-section-title">Shape</div>
        <div class="prop-row">
          <label class="prop-label">Type</label>
          <select class="form-select form-select-sm prop-control" :value="element.shape" @change="update('shape',$event.target.value)">
            <option value="rectangle">Rectangle</option><option value="circle">Circle</option><option value="line">Line</option>
          </select>
        </div>
        <div class="prop-row">
          <label class="prop-label">Fill</label>
          <div class="d-flex gap-2"><input type="color" class="color-swatch" :value="element.fillColor||'#e0f0ff'" @input="update('fillColor',$event.target.value)" /><button class="btn btn-xs btn-outline-secondary" @click="update('fillColor','transparent')">None</button></div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Stroke</label>
          <div class="d-flex gap-2"><input type="color" class="color-swatch" :value="element.strokeColor||'#1a56db'" @input="update('strokeColor',$event.target.value)" /><input type="number" class="form-control form-control-sm" style="width:60px" :value="element.strokeWidth||1" @change="update('strokeWidth',+$event.target.value)" min="0" max="20" /></div>
        </div>
        <div v-if="element.shape==='rectangle'" class="prop-row">
          <label class="prop-label">Radius</label>
          <input type="number" class="form-control form-control-sm prop-control" :value="element.borderRadius||0" @change="update('borderRadius',+$event.target.value)" min="0" />
        </div>
      </div>

      <!-- Advanced Shape Options -->
      <div class="panel-section">
        <div class="panel-section-title">Advanced (PDFKit)</div>
        <div class="prop-row">
          <label class="prop-label">Dash / Gap</label>
          <div class="d-flex gap-2">
            <input type="number" class="form-control form-control-sm" style="width:60px" :value="element.dash||0" @change="update('dash',+$event.target.value)" min="0" placeholder="dash" />
            <input type="number" class="form-control form-control-sm" style="width:60px" :value="element.dashSpace||0" @change="update('dashSpace',+$event.target.value)" min="0" placeholder="gap" />
          </div>
        </div>
        <div class="prop-row">
          <label class="prop-label">Line Cap</label>
          <select class="form-select form-select-sm prop-control" :value="element.lineCap||'butt'" @change="update('lineCap',$event.target.value)">
            <option value="butt">Butt</option><option value="round">Round</option><option value="square">Square</option>
          </select>
        </div>
        <div class="prop-row">
          <label class="prop-label">Line Join</label>
          <select class="form-select form-select-sm prop-control" :value="element.lineJoin||'miter'" @change="update('lineJoin',$event.target.value)">
            <option value="miter">Miter</option><option value="round">Round</option><option value="bevel">Bevel</option>
          </select>
        </div>
        <div class="prop-row">
          <label class="prop-label">Fill Opacity</label>
          <div class="d-flex gap-2 align-items-center">
            <input type="range" class="form-range" style="flex:1" min="0" max="1" step="0.05"
              :value="element.fillOpacity??1" @input="update('fillOpacity',+$event.target.value)" />
            <span style="font-size:11px;width:32px">{{ Math.round((element.fillOpacity??1)*100) }}%</span>
          </div>
        </div>
      </div>
    </template>

    <!-- ═══ DIVIDER ELEMENT ═══════════════════════════════════════════════ -->
    <template v-if="element.type === 'divider'">
      <div class="panel-section">
        <div class="panel-section-title">Divider</div>
        <div class="prop-row"><label class="prop-label">Color</label><input type="color" class="color-swatch" :value="element.color||'#cccccc'" @input="update('color',$event.target.value)" /></div>
        <div class="prop-row"><label class="prop-label">Thickness</label><input type="number" class="form-control form-control-sm prop-control" :value="element.thickness||1" @change="update('thickness',+$event.target.value)" min="1" max="20" /></div>
        <div class="prop-row">
          <label class="prop-label">Style</label>
          <select class="form-select form-select-sm prop-control" :value="element.style||'solid'" @change="update('style',$event.target.value)">
            <option value="solid">Solid</option><option value="dashed">Dashed</option><option value="dotted">Dotted</option>
          </select>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { uploadApi, fontsApi } from '../api'
import RichTextEditor from './RichTextEditor.vue'

const props = defineProps({ element: Object })
const emit  = defineEmits(['update', 'delete', 'duplicate', 'bring-forward', 'send-backward'])

// ─── type icon ───────────────────────────────────────────────────────────────
const typeIcon = computed(() => ({
  text: 'bi bi-fonts', image: 'bi bi-image', table: 'bi bi-table',
  shape: 'bi bi-square', divider: 'bi bi-dash-lg',
}[props.element?.type] || 'bi bi-square'))

function update(key, val) { emit('update', { [key]: val }) }

// ─── font list ────────────────────────────────────────────────────────────────
const CSS_MAP = {
  Helvetica: 'Helvetica, Arial, sans-serif',
  'Times-Roman': '"Times New Roman", serif',
  Courier: '"Courier New", monospace',
  Sarabun: 'Sarabun, sans-serif',
  Kanit: 'Kanit, sans-serif',
  Prompt: 'Prompt, sans-serif',
  Mitr: 'Mitr, sans-serif',
  NotoSansThai: '"Noto Sans Thai", sans-serif',
  ChakraPetch: '"Chakra Petch", sans-serif',
  Trirong: 'Trirong, serif',
  IBMPlexSansThai: '"IBM Plex Sans Thai", sans-serif',
  Roboto: 'Roboto, sans-serif',
  OpenSans: '"Open Sans", sans-serif',
  Lato: 'Lato, sans-serif',
}

const allFonts = ref([])

onMounted(async () => {
  try {
    const res = await fontsApi.getAll()
    allFonts.value = res.data.map(f => ({ ...f, cssFamily: CSS_MAP[f.key] || f.name + ', sans-serif' }))
  } catch {
    allFonts.value = [
      { key: 'Helvetica',   name: 'Helvetica',        language: 'latin', cssFamily: 'Helvetica, Arial, sans-serif' },
      { key: 'Times-Roman', name: 'Times New Roman',  language: 'latin', cssFamily: '"Times New Roman", serif' },
      { key: 'Courier',     name: 'Courier',           language: 'latin', cssFamily: '"Courier New", monospace' },
      { key: 'Sarabun',     name: 'Sarabun',           language: 'thai',  cssFamily: 'Sarabun, sans-serif' },
      { key: 'Kanit',       name: 'Kanit',             language: 'thai',  cssFamily: 'Kanit, sans-serif' },
      { key: 'Prompt',      name: 'Prompt',            language: 'thai',  cssFamily: 'Prompt, sans-serif' },
    ]
  }
  document.addEventListener('click', onOutside)
})
onUnmounted(() => document.removeEventListener('click', onOutside))

// ─── text font dropdown ───────────────────────────────────────────────────────
const fontDropOpen  = ref(false)
const fontSearch    = ref('')
const fontDropRef   = ref(null)
const fontSearchRef = ref(null)

function onOutside(e) {
  if (fontDropRef.value && !fontDropRef.value.contains(e.target)) fontDropOpen.value = false
  if (tableFontDropRef.value && !tableFontDropRef.value.contains(e.target)) tableFontDropOpen.value = false
  if (tableHdrFontDropRef.value && !tableHdrFontDropRef.value.contains(e.target)) tableHdrFontDropOpen.value = false
}

function toggleFontDrop() {
  fontDropOpen.value = !fontDropOpen.value
  if (fontDropOpen.value) { fontSearch.value = ''; nextTick(() => fontSearchRef.value?.focus()) }
}

const filtered     = computed(() => allFonts.value.filter(f => f.name.toLowerCase().includes(fontSearch.value.toLowerCase())))
const thaiFonts    = computed(() => filtered.value.filter(f => f.language === 'thai'))
const latinFonts   = computed(() => filtered.value.filter(f => f.language === 'latin'))

const currentFontName = computed(() => allFonts.value.find(f => f.key === props.element?.fontFamily)?.name || props.element?.fontFamily || 'Helvetica')
const cssFontFamily   = computed(() => CSS_MAP[props.element?.fontFamily] || 'sans-serif')

function applyFont(key) { update('fontFamily', key); fontDropOpen.value = false }
function toggleDeco(val) { update('textDecoration', props.element.textDecoration === val ? 'none' : val) }

// ─── table BODY font dropdown ────────────────────────────────────────────────
const tableFontDropOpen  = ref(false)
const tableFontSearch    = ref('')
const tableFontDropRef   = ref(null)
const tableFontSearchRef = ref(null)

function toggleTableFontDrop() {
  tableFontDropOpen.value = !tableFontDropOpen.value
  tableHdrFontDropOpen.value = false
  if (tableFontDropOpen.value) { tableFontSearch.value = ''; nextTick(() => tableFontSearchRef.value?.focus()) }
}

const tableFiltered      = computed(() => allFonts.value.filter(f => f.name.toLowerCase().includes(tableFontSearch.value.toLowerCase())))
const tableThaiFiltered  = computed(() => tableFiltered.value.filter(f => f.language === 'thai'))
const tableLatinFiltered = computed(() => tableFiltered.value.filter(f => f.language === 'latin'))
const tableCurrentFontName = computed(() => allFonts.value.find(f => f.key === props.element?.fontFamily)?.name || props.element?.fontFamily || 'Helvetica')
const tableCssFontFamily   = computed(() => CSS_MAP[props.element?.fontFamily] || 'sans-serif')
function applyTableFont(key) { update('fontFamily', key); tableFontDropOpen.value = false }

// ─── table HEADER font dropdown ───────────────────────────────────────────────
const tableHdrFontDropOpen  = ref(false)
const tableHdrFontSearch    = ref('')
const tableHdrFontDropRef   = ref(null)
const tableHdrFontSearchRef = ref(null)

function toggleTableHdrFontDrop() {
  tableHdrFontDropOpen.value = !tableHdrFontDropOpen.value
  tableFontDropOpen.value = false
  if (tableHdrFontDropOpen.value) { tableHdrFontSearch.value = ''; nextTick(() => tableHdrFontSearchRef.value?.focus()) }
}

const tableHdrFiltered      = computed(() => allFonts.value.filter(f => f.name.toLowerCase().includes(tableHdrFontSearch.value.toLowerCase())))
const tableHdrThaiFiltered  = computed(() => tableHdrFiltered.value.filter(f => f.language === 'thai'))
const tableHdrLatinFiltered = computed(() => tableHdrFiltered.value.filter(f => f.language === 'latin'))
const tableHdrCurrentFontName = computed(() => {
  const key = props.element?.headerFontFamily || props.element?.fontFamily
  return allFonts.value.find(f => f.key === key)?.name || key || 'Helvetica'
})
const tableHdrCssFontFamily = computed(() => CSS_MAP[props.element?.headerFontFamily || props.element?.fontFamily] || 'sans-serif')
function applyTableHdrFont(key) { update('headerFontFamily', key); tableHdrFontDropOpen.value = false }

// ─── table column helpers ─────────────────────────────────────────────────────
function addCol() {
  const cols = [...(props.element.columns || [])]
  cols.push({ key: `col${cols.length + 1}`, label: `Column ${cols.length + 1}`, width: Math.floor(100 / (cols.length + 1)), align: 'left' })
  update('columns', cols)
}
function removeCol(i) { const c = [...(props.element.columns||[])]; c.splice(i,1); update('columns',c) }
function updateCol(i, key, val) { update('columns', props.element.columns.map((c,idx) => idx===i ? {...c,[key]:val} : c)) }

// ─── static rows helpers ──────────────────────────────────────────────────────
function addStaticRow() {
  const rows = [...(props.element.staticRows || [])]
  const newRow = {}
  ;(props.element.columns || []).forEach(c => { newRow[c.key] = '' })
  rows.push(newRow)
  update('staticRows', rows)
}
function removeStaticRow(i) {
  const rows = [...(props.element.staticRows || [])]
  rows.splice(i, 1)
  update('staticRows', rows)
}
function updateStaticCell(rowIdx, colKey, val) {
  const rows = (props.element.staticRows || []).map((r, i) => i === rowIdx ? { ...r, [colKey]: val } : r)
  update('staticRows', rows)
}

async function uploadImage(e) {
  const file = e.target.files[0]; if (!file) return
  try { const r = await uploadApi.uploadImage(file); update('src', r.data.url) }
  catch(err) { alert('Upload failed: ' + err.message) }
}

// Image mode
const imgMode    = ref('static')
const testBase64 = ref('')

watch(() => props.element?.bindingKey, (v) => {
  if (v) imgMode.value = 'variable'
}, { immediate: true })

const base64ExampleJson = computed(() => {
  const key = props.element?.bindingKey || 'imageData'
  return `{\n  "${key}": "/9j/4AAQSkZJRg..."\n  // หรือ\n  "${key}": "data:image/png;base64,iVBOR..."\n}`
})

function normalizeBase64(src) {
  if (!src) return ''
  if (src.startsWith('data:')) return src
  if (src.length > 100 && /^[A-Za-z0-9+/=]+$/.test(src.substring(0, 40))) {
    return 'data:image/png;base64,' + src
  }
  return src
}
</script>

<style scoped>
.element-props { padding-bottom: 48px; }

/* Header */
.props-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--gray-200);
  background: var(--gray-50);
  position: sticky; top: 0; z-index: 20;
}
.el-type-badge {
  width: 26px; height: 26px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; font-size: 13px;
}
.type-text    { background:#dbeafe; color:#1d4ed8; }
.type-image   { background:#dcfce7; color:#16a34a; }
.type-table   { background:#fef9c3; color:#b45309; }
.type-shape   { background:#f3e8ff; color:#7c3aed; }
.type-divider { background:#fee2e2; color:#dc2626; }

/* Labels */
.tiny-label { font-size: 11px; color: var(--gray-500); margin-bottom: 3px; display: block; }

/* Font dropdown */
.font-dropdown-wrap { position: relative; }
.font-trigger {
  width: 100%; height: 32px;
  border: 1px solid var(--gray-300); border-radius: 6px;
  background: white; padding: 0 8px; cursor: pointer;
  display: flex; align-items: center; gap: 6px;
  font-size: 13px; transition: border-color .15s;
}
.font-trigger:hover, .font-trigger:focus { border-color: var(--primary); outline: none; }
.font-trigger-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-align: left; }

.font-dropdown-panel {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0;
  min-width: 220px; max-width: 300px;
  background: white; border: 1px solid var(--gray-200);
  border-radius: 10px; box-shadow: 0 8px 28px rgba(0,0,0,.16);
  z-index: 9999; max-height: 320px; overflow-y: auto;
}
.font-search-row {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 10px; border-bottom: 1px solid var(--gray-100);
  position: sticky; top: 0; background: white; z-index: 1;
}
.font-search-row i  { color: var(--gray-400); font-size: 12px; }
.font-search-row input { border: none; outline: none; flex: 1; font-size: 12px; background: transparent; }
.font-group-label {
  font-size: 10px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .5px; color: var(--gray-400);
  padding: 6px 10px 2px; position: sticky; top: 44px; background: white;
}
.font-opt {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 10px; cursor: pointer; border-radius: 4px; margin: 1px 4px;
  transition: background .1s;
}
.font-opt:hover  { background: var(--gray-50); }
.font-opt.active { background: var(--primary-light); }
.font-opt-name    { font-size: 12px; font-weight: 500; color: var(--gray-800); }
.font-opt-preview { font-size: 13px; color: var(--gray-400); }

/* Size spinner */
.size-spin {
  display: flex; align-items: center;
  border: 1px solid var(--gray-300); border-radius: 6px; overflow: hidden; height: 32px;
}
.size-spin button {
  width: 28px; height: 100%; border: none; background: var(--gray-50);
  color: var(--gray-600); cursor: pointer; font-size: 16px;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background .1s;
}
.size-spin button:hover { background: var(--primary-light); color: var(--primary); }
.size-spin input {
  flex: 1; text-align: center; border: none; outline: none;
  font-size: 12px; font-weight: 600; color: var(--gray-800);
  -moz-appearance: textfield; padding: 0;
}
.size-spin input::-webkit-outer-spin-button,
.size-spin input::-webkit-inner-spin-button { -webkit-appearance: none; }

/* Style buttons */
.style-row { display: flex; gap: 3px; align-items: center; flex-wrap: wrap; }
.sty-btn {
  width: 30px; height: 30px;
  border: 1px solid var(--gray-200); border-radius: 5px;
  background: white; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: var(--gray-600); transition: all .12s; flex-shrink: 0;
}
.sty-btn:hover  { background: var(--primary-light); border-color: var(--primary); color: var(--primary); }
.sty-btn.active { background: var(--primary); border-color: var(--primary); color: white; }
.sty-sep { width: 1px; height: 20px; background: var(--gray-200); margin: 0 2px; }

/* Color row */
.color-pick-row { display: flex; gap: 4px; align-items: center; }

/* Table column editor */
.col-editor {
  background: var(--gray-50); border: 1px solid var(--gray-200);
  border-radius: 6px; padding: 8px;
}
.col-num {
  width: 18px; height: 18px; background: var(--primary); color: white;
  border-radius: 50%; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}

.btn-xs { font-size: 11px; padding: 2px 6px; line-height: 1.5; }
code { font-size: 11px; background: var(--gray-100); padding: 1px 4px; border-radius: 3px; }

/* Static rows editor */
.static-rows-list { max-height: 300px; overflow-y: auto; }
.static-row-item {
  background: var(--gray-50); border: 1px solid var(--gray-200);
  border-radius: 6px; padding: 6px 8px; margin-bottom: 4px;
}

/* Image mode tabs */
.img-mode-tabs { display: flex; border: 1px solid var(--gray-200); border-radius: 6px; overflow: hidden; }
.img-mode-btn {
  flex: 1; padding: 6px 8px; border: none; background: var(--gray-50);
  font-size: 11px; font-weight: 500; cursor: pointer; color: var(--gray-500);
  transition: all .15s; display: flex; align-items: center; justify-content: center;
}
.img-mode-btn:hover { background: var(--gray-100); color: var(--gray-700); }
.img-mode-btn.active { background: var(--primary); color: white; }

/* Image preview */
.img-preview-wrap { border: 1px solid var(--gray-200); border-radius: 6px; overflow: hidden; background: var(--gray-50); display: flex; align-items: center; justify-content: center; min-height: 80px; max-height: 140px; }
.img-preview { max-width: 100%; max-height: 140px; object-fit: contain; }

/* base64 info box */
.base64-info {
  background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px;
  padding: 7px 10px; font-size: 11px; color: #1d4ed8; display: flex; align-items: flex-start; gap: 4px;
}
.code-block {
  background: var(--gray-800); color: #86efac;
  border-radius: 6px; padding: 8px 10px; font-size: 10px;
  margin: 0; overflow-x: auto; white-space: pre;
}
</style>
