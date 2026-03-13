# PDF Template Builder

ระบบสร้าง PDF Template แบบ Drag & Drop พร้อม REST API สำหรับการ Generate PDF

## Stack
- **Frontend**: Vue 3 + Vite + Bootstrap 5
- **Backend**: NestJS + TypeORM + SQLite (better-sqlite3)
- **PDF Engine**: PDFKit

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
npm run start:dev
```

Backend จะรันที่ http://localhost:3000
Swagger UI: http://localhost:3000/api

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend จะรันที่ http://localhost:5173

---

## 📁 Project Structure

```
pdf-template-system/
├── backend/
│   ├── src/
│   │   ├── templates/          # Template CRUD
│   │   │   ├── template.entity.ts
│   │   │   ├── templates.service.ts
│   │   │   ├── templates.controller.ts
│   │   │   └── templates.module.ts
│   │   ├── generate/           # PDF Generation
│   │   │   ├── generate.service.ts
│   │   │   └── generate.controller.ts
│   │   ├── app.module.ts
│   │   └── main.ts
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── views/
    │   │   ├── HomeView.vue       # Template listing
    │   │   ├── EditorView.vue     # Template editor
    │   │   └── GenerateView.vue   # Generate PDF
    │   ├── components/
    │   │   ├── PageCanvas.vue     # Drag/resize canvas
    │   │   ├── ElementProps.vue   # Properties panel
    │   │   ├── PageProps.vue      # Page settings
    │   │   └── TemplateVariables.vue
    │   ├── stores/editor.js       # Pinia store
    │   └── api.js                 # API client
    └── package.json
```

---

## 🎨 Features

### Template Editor
- **Drag & Drop** elements บน canvas
- **Resize** elements ด้วย 8 จุด handle
- **Undo/Redo** (Ctrl+Z / Ctrl+Y)
- **Page management**: เพิ่ม/ลบ/duplicate pages
- **Zoom** in/out canvas

### Element Types
| Type | Description |
|------|-------------|
| **Text** | Rich text with font, color, alignment, data binding |
| **Image** | Upload หรือ URL, objectFit options |
| **Table** | Dynamic columns, data binding, zebra stripes |
| **Shape** | Rectangle, circle, line with fill/stroke |
| **Divider** | Horizontal line, solid/dashed/dotted |

### Table Features
- กำหนด Column ได้เอง (key, label, width %, alignment)
- Bind ข้อมูลจาก JSON array (`dataKey`)
- **Repeat header on new page**: เมื่อข้อมูลเกินหน้า จะแสดง header ตารางซ้ำ
- Zebra stripes (alt row color)

### Data Binding
ใส่ `{{variableName}}` ในช่อง Text เพื่อแทนค่าจาก JSON data

```
Hello {{name}}!
Date: {{orderDate}}
```

---

## 🔌 REST API

### Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates` | List all templates |
| GET | `/templates/:id` | Get template |
| POST | `/templates` | Create template |
| PUT | `/templates/:id` | Update template |
| DELETE | `/templates/:id` | Delete template |
| POST | `/templates/:id/duplicate` | Duplicate |

### Generate PDF

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/templates/:id/generate` | Download PDF |
| POST | `/templates/:id/preview` | Preview inline |
| POST | `/upload/image` | Upload image |

### Example: Generate PDF via API

```bash
curl -X POST http://localhost:3000/templates/{id}/generate \
  -H "Content-Type: application/json" \
  -d '{
    "name": "สมชาย ใจดี",
    "orderDate": "18/02/2026",
    "items": [
      { "no": "1", "description": "สินค้า A", "qty": 5, "price": "500.00", "total": "2,500.00" },
      { "no": "2", "description": "สินค้า B", "qty": 3, "price": "750.00", "total": "2,250.00" }
    ]
  }' \
  --output invoice.pdf
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save template |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Ctrl+D | Duplicate element |
| Delete | Remove selected element |
| Escape | Deselect element |
| Double-click | Edit text inline |

---

## 📐 Page Sizes Supported
- A4 (595.28 × 841.89 pt)
- A3 (841.89 × 1190.55 pt)
- Letter (612 × 792 pt)
- Legal (612 × 1008 pt)
- Custom (กำหนดขนาดเอง)
- Portrait / Landscape orientation
