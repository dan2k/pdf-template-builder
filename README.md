# PDF Template Builder

ระบบสร้างและจัดการ PDF Template แบบ Visual Editor พร้อม REST API สำหรับ Generate PDF อัตโนมัติ รองรับภาษาไทยเต็มรูปแบบ

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Vue 3, Vite, Pinia, Bootstrap 5 |
| Backend | NestJS, TypeORM, SQLite (better-sqlite3) |
| PDF Engine | PDFKit + Custom Rendering Engine |
| AI | OpenAI, Anthropic, Gemini, OpenRouter, Local LLM |
| Deploy | Docker Compose (Backend :3000, Frontend Nginx :80) |

---

## Quick Start

### Backend

```bash
cd backend
npm install
npm run start:dev
```

- API: http://localhost:3000
- Swagger: http://localhost:3000/api

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- App: http://localhost:5173

### Docker

```bash
docker-compose up --build
```

- Frontend: http://localhost
- Backend: http://localhost:3000

---

## Features

### Visual Template Editor
- Drag & Drop elements บน canvas
- Resize ด้วย 8 จุด handle
- Multi-select (Ctrl+Click / Shift+Click / Marquee selection)
- Undo/Redo (Ctrl+Z / Ctrl+Y)
- Multi-page management (เพิ่ม/ลบ/duplicate)
- Zoom in/out
- Resizable properties panel (ลากขอบซ้ายเพื่อขยาย/ย่อ)
- Group/Ungroup elements (Ctrl+G / Ctrl+Shift+G)
- Layers panel สำหรับจัดลำดับ elements
- Global Header/Footer/Page Number
- AI Assistant สำหรับสร้าง/แก้ไข template ด้วย prompt

### Element Types

| Type | รายละเอียด |
|------|-----------|
| Text | Plain text หรือ Rich Text mode พร้อม data binding |
| Image | Upload, URL, base64, SVG (แปลงเป็น PNG อัตโนมัติ) |
| Table | Dynamic (dataKey) หรือ Static (กำหนดข้อมูลเอง) |
| Shape | Rectangle, Circle, Ellipse, Triangle, Line, Polygon |
| Divider | Solid, Dashed, Dotted, Double |
| Barcode/QR | รองรับ data binding |
| Group | รวม elements เป็นกลุ่ม |

### Rich Text (Content Blocks)

Text element รองรับ Rich Text mode ที่สลับเปิด/ปิดได้ ประกอบด้วย:

- **Heading** H1, H2, H3
- **Paragraph** พร้อม indent, bold, italic, สี, จัดตำแหน่ง
- **List** หลายรูปแบบ:

| ประเภท | Styles |
|--------|--------|
| Unordered | ● Disc, ○ Circle, ■ Square, – Dash, ▸ Arrow, ✓ Check |
| Ordered | 1. Decimal, 01. Zero-padded, a. Alpha, A. Upper Alpha, i. Roman, I. Upper Roman, ๑. Thai |
| Interactive | ☑ Checkbox (เลือกได้หลายตัว), ◉ Radio (เลือกได้ตัวเดียว) |

ทุก list รองรับ:
- Per-item indent level (nested list)
- Per-item checked state (checkbox/radio)
- Dynamic data binding จาก JSON
- `{{variable}}` ใน text ของแต่ละ item

### Table Types

| | Data Table | Static Table |
|---|---|---|
| ข้อมูล | Dynamic จาก JSON (dataKey) | กำหนดเองใน editor |
| ใช้กับ | API generate ส่ง data เข้ามา | ข้อมูลคงที่ เช่น ตารางราคา |
| Page break | รองรับ (repeat header) | รองรับ |
| สร้างจาก | Toolbar → Table → Data Table | Toolbar → Table → Simple Grid |

### Preview
- Preview PDF จาก editor (auto mock data จาก variables และ table dataKeys)
- Fullscreen / Exit Fullscreen toggle
- Generate View พร้อม JSON input, sample data, API usage guide

---

## Authentication & Authorization

- JWT-based authentication (login/logout)
- 2 roles: Admin (full access) / User (เฉพาะ template ตัวเอง + public)
- First-login password change enforcement
- Account suspension
- Activity logging (audit trail)
- API Key authentication สำหรับ external access (`X-API-Key` header)
- Rate limiting: 100 requests / 60 วินาที

---

## Admin Panel

เข้าถึงได้ที่ `/admin` (เฉพาะ Admin role)

### User Management
- เพิ่ม/แก้ไข/ลบ user
- กำหนด role (admin/user) และ department
- Reset password
- Enable/Disable account

### Department Management
- เพิ่ม/แก้ไข/ลบ department

### AI Configuration
- เลือก AI provider (Gemini, OpenAI, Anthropic, OpenRouter, Local LLM)
- กำหนด API Key และ model สำหรับแต่ละ provider
- สลับ provider ได้ทันทีไม่ต้อง restart

### Font Management
- ดูรายการ font ทั้งหมด (ชื่อ, key, ภาษา, variants, สถานะ)
- Upload font ใหม่ (.ttf/.otf) — โหลดเข้าระบบทันที
- Hide/Show font — font ที่ซ่อนจะไม่แสดงใน editor แต่ยัง render PDF ได้
- Delete custom font (builtin fonts ลบไม่ได้)
- Reload fonts จาก disk

#### การเพิ่ม Font

ตั้งชื่อไฟล์ตามรูปแบบ: `[ชื่อFont]-[Style].ttf`

| Style | คำอธิบาย |
|-------|---------|
| Regular | ตัวปกติ (จำเป็น) |
| Bold | ตัวหนา |
| Italic | ตัวเอียง |
| BoldItalic | ตัวหนา+เอียง |

ตัวอย่าง font Sarabun:
```
Sarabun-Regular.ttf
Sarabun-Bold.ttf
Sarabun-Italic.ttf
Sarabun-BoldItalic.ttf
```

Upload ทีละไฟล์ผ่าน Admin Panel ระบบจะจับกลุ่มให้อัตโนมัติ
ถ้ามีแค่ไฟล์เดียว (เช่น `MyFont.ttf`) ระบบจะใช้ไฟล์นั้นสำหรับทุก style

แนะนำดาวน์โหลดจาก [Google Fonts](https://fonts.google.com)

---

## Data Binding

### Plain Text
ใส่ `{{variableName}}` ในช่อง Text:
```
สวัสดี {{name}}
วันที่: {{orderDate}}
```

### Rich Text List (Dynamic)

เปิด Rich Text mode → เพิ่ม List → ติ๊ก Dynamic → กำหนด:
- **Data Key**: ชื่อ key ใน JSON ที่เป็น array
- **Item Template**: รูปแบบข้อความแต่ละ item

ตัวอย่าง:

```json
// dataKey: "features", itemTemplate: "{{.}}"
{ "features": ["รวดเร็ว", "ปลอดภัย", "ใช้ง่าย"] }

// dataKey: "items", itemTemplate: "{{name}} จำนวน {{qty}} ชิ้น"
{ "items": [
    { "name": "สินค้า A", "qty": 2 },
    { "name": "สินค้า B", "qty": 5 }
  ]
}
```

### Checkbox/Radio (Dynamic)

```json
// แบบที่ 1: Object มี checked field
// dataKey: "options", itemTemplate: "{{name}}"
{ "options": [
    { "name": "ตัวเลือก A", "checked": true },
    { "name": "ตัวเลือก B", "checked": false }
  ]
}

// แบบที่ 2: Array + checkedKey แยก
// dataKey: "options", itemTemplate: "{{.}}", checkedKey: "selected"
{ "options": ["เห็นด้วย", "ไม่เห็นด้วย", "งดออกเสียง"],
  "selected": ["เห็นด้วย"]
}
```

### Variables Management

กำหนดตัวแปรได้ใน Properties panel (เมื่อไม่ได้เลือก element):
- รองรับ types: String, Number, Date, Boolean, Image (base64), Array, Object
- ค้นหา, เรียงลำดับ (drag), duplicate, collapse/expand
- กำหนด description และ default value
- Preview จะสร้าง mock data อัตโนมัติจาก variables และ table dataKeys

---

## REST API

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List templates (filtered by role) |
| GET | `/templates/:id` | Get template |
| POST | `/templates` | Create template |
| PUT | `/templates/:id` | Update template |
| DELETE | `/templates/:id` | Soft delete template |
| POST | `/templates/:id/copy` | Duplicate template |

### Generate PDF

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/templates/:id/generate` | API Key | Generate PDF (binary หรือ base64) |
| POST | `/templates/:id/preview` | ไม่จำเป็น | Preview PDF inline |

### Fonts (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/fonts` | Get visible fonts |
| GET | `/fonts/all` | Get all fonts (admin) |
| POST | `/fonts/upload` | Upload font file |
| PATCH | `/fonts/:key/visibility` | Toggle hide/show |
| DELETE | `/fonts/:key` | Delete custom font |
| POST | `/fonts/reload` | Reload from disk |

### อื่นๆ

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/login` | Login |
| POST | `/auth/change-password` | Change password |
| GET/POST | `/categories` | Category management |
| GET/POST | `/users` | User management (admin) |
| GET/POST | `/departments` | Department management |
| POST | `/upload/image` | Upload image |
| POST | `/import/pdf` | Import PDF to template |
| POST | `/ai/transform` | AI template generation |
| GET/POST | `/settings/ai` | AI provider settings |

### Generate PDF via API

```bash
# รับเป็นไฟล์ PDF
curl -X POST http://localhost:3000/templates/{id}/generate \
  -H "X-API-Key: sk_xxx.yyy" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "สมชาย ใจดี",
    "items": [
      { "name": "สินค้า A", "qty": 5, "price": "500.00" },
      { "name": "สินค้า B", "qty": 3, "price": "750.00" }
    ]
  }' \
  --output document.pdf

# รับเป็น Base64 JSON
curl -X POST http://localhost:3000/templates/{id}/generate \
  -H "X-API-Key: sk_xxx.yyy" \
  -H "Content-Type: application/json" \
  -d '{
    "responseType": "base64",
    "name": "สมชาย ใจดี"
  }'
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save template |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+D | Duplicate element |
| Ctrl+G | Group selected elements |
| Ctrl+Shift+G | Ungroup |
| Ctrl+Click | Multi-select element |
| Shift+Click | Multi-select element |
| Delete | Remove selected element |
| Escape | Deselect |
| Double-click | Edit text inline |
| Arrow keys | Move element (1px) |
| Shift+Arrow | Move element (10px) |

---

## Page Sizes

- A4 (595.28 × 841.89 pt)
- A3 (841.89 × 1190.55 pt)
- Letter (612 × 792 pt)
- Legal (612 × 1008 pt)
- Custom (กำหนดขนาดเอง)
- Portrait / Landscape

---

## Project Structure

```
pdf-template-system/
├── backend/
│   ├── src/
│   │   ├── auth/               # JWT authentication, roles guard
│   │   ├── users/              # User management
│   │   ├── departments/        # Department management
│   │   ├── templates/          # Template CRUD, entity definitions
│   │   ├── generate/           # PDF generation engine
│   │   ├── categories/         # Hierarchical categories
│   │   ├── fonts/              # Font management (upload, visibility)
│   │   ├── ai/                 # Multi-provider AI integration
│   │   ├── api-keys/           # API key management
│   │   ├── settings/           # System settings
│   │   ├── activity-logs/      # Audit trail
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── fonts/                  # Font files (.ttf)
│   ├── data/                   # SQLite database
│   └── uploads/                # Uploaded images
│
├── frontend/
│   ├── src/
│   │   ├── views/
│   │   │   ├── HomeView.vue        # Dashboard, template library
│   │   │   ├── EditorView.vue      # Visual template editor
│   │   │   ├── GenerateView.vue    # PDF generation + preview
│   │   │   ├── AdminView.vue       # Admin panel
│   │   │   ├── LoginView.vue       # Authentication
│   │   │   └── ChangePasswordView.vue
│   │   ├── components/
│   │   │   ├── PageCanvas.vue      # Drag/resize canvas
│   │   │   ├── ElementProps.vue    # Properties panel
│   │   │   ├── RichTextEditor.vue  # Rich text block editor
│   │   │   ├── TemplateVariables.vue # Variable management
│   │   │   ├── LayersPanel.vue     # Element layers
│   │   │   ├── HeaderFooterEditor.vue
│   │   │   ├── ApiKeyManager.vue
│   │   │   └── FontPicker.vue
│   │   ├── stores/
│   │   │   ├── auth.js             # Auth state (Pinia)
│   │   │   └── editor.js           # Editor state, undo/redo
│   │   └── api.js                  # API client (Axios)
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## Included Thai Fonts

Sarabun, Kanit, Prompt, Mitr, Noto Sans Thai, Chakra Petch, Trirong

เพิ่มเติมได้ผ่าน Admin Panel → Font Management
