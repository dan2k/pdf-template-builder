# คู่มือการใช้งานระบบสร้างเทมเพลต PDF (User Manual)

ยินดีต้อนรับสู่ระบบสร้าง PDF Template แบบครบวงจร! ระบบที่จะช่วยให้การสร้างเอกสาร PDF เช่น ใบเสร็จรับเงิน, ใบแจ้งหนี้ หรือเอกสารราชการ เป็นเรื่องง่ายและรวดเร็ว โดยไม่จำเป็นต้องเขียนโปรแกรม

---

## 1. ภาพรวมระบบ (System Overview)

ระบบนี้คือเครื่องมือออกแบบและสร้างเอกสาร PDF ที่ทำงานบนเว็บเบราว์เซอร์ โดยใช้หลักการ **"ลากและวาง" (Drag & Drop)** เพื่อจัดวางองค์ประกอบต่างๆ เช่น ข้อความ รูปภาพ ตาราง และรูปทรง ลงบนหน้ากระดาษอย่างอิสระ

**ระบบนี้ช่วยแก้ปัญหาอะไร?**
- **ลดเวลาในการออกแบบเอกสารที่ซับซ้อน**: แก้ไขรูปแบบเอกสารได้ทันทีผ่านหน้าเว็บ
- **แยกหน้าที่ระหว่างคนออกแบบ (Designer) และนักพัฒนา (Developer)**:
  - **Designer/Admin**: สามารถดูแลความสวยงาม จัดวางโลโก้ หรือเปลี่ยนฟอนต์ได้ด้วยตัวเองโดยไม่ต้องรอโปรแกรมเมอร์มาแก้ไขโค้ด
  - **Developer**: มีหน้าที่เพียงแค่ส่งข้อมูลชุดเดิมผ่าน API ระบบจะทำการวาดเอกสารตามเทมเพลตใหม่ให้ทันที
- **รองรับ AI Assistant หลายค่าย**: จัดการทุกอย่างง่ายๆ ผ่าน Admin Panel (Support: Gemini, ChatGPT, Claude, OpenRouter, Local LLM)
- **รองรับข้อมูลที่เปลี่ยนแปลงได้ (Dynamic Data)**: ดึงข้อมูลชื่อลูกค้าหรือรายการสินค้าจากระบบอื่นมาใส่ใน PDF ได้โดยอัตโนมัติ
- **Rich Text**: รองรับการจัดรูปแบบข้อความขั้นสูง หัวข้อ รายการ Checkbox/Radio
- **จัดการฟอนต์ผ่าน Admin Panel**: เพิ่ม/ลบ/ซ่อนฟอนต์ได้โดยไม่ต้อง restart server

---

## 2. คุณสมบัติหลัก (Key Features)

- **Template Editor**: ออกแบบ PDF ได้เหมือนใช้โปรแกรมวาดภาพ รองรับการย่อ-ขยาย จัดลำดับชั้น และ Multi-select
- **Rich Text Editor**: สร้างเนื้อหาแบบ Block (หัวข้อ, ย่อหน้า, รายการ, Checkbox, Radio) พร้อม Dynamic Data Binding
- **AI Assistant**: สั่งงานด้วย AI ผ่านข้อความภาษาไทยหรืออังกฤษ
- **Dynamic Elements**: ใส่ค่าตัวแปรในรูปแบบ `{{ตัวแปร}}` เพื่อเปลี่ยนข้อมูลใน PDF ตามข้อมูลที่ส่งเข้ามา
- **Multi-page Support**: รองรับเอกสารหลายหน้า Header/Footer/เลขหน้า
- **Static & Dynamic Table**: ตารางข้อมูลคงที่ (กำหนดเอง) หรือดึงจาก JSON
- **API Integration**: ระบบ API Key สำหรับเชื่อมต่อระบบภายนอก
- **Font Management**: เพิ่ม/ลบ/ซ่อนฟอนต์ผ่าน Admin Panel
- **Resizable Panel**: ขยาย/ย่อแถบ Properties ด้านขวาได้
- **Preview Fullscreen**: ดู Preview PDF แบบเต็มจอได้

---

## 3. ระดับผู้ใช้งาน (User Levels)

### 3.1 ผู้ดูแลระบบ (Admin)
- **สิทธิ์สูงสุด**: จัดการผู้ใช้งาน หน่วยงาน ฟอนต์ และ AI Provider
- **การจัดการเอกสาร**: ดู แก้ไข ลบ คัดลอกเทมเพลตของทุกคนได้
- **Font Management**: เพิ่ม/ลบ/ซ่อนฟอนต์ในระบบ

### 3.2 ผู้ใช้งานทั่วไป (User)
- สร้างและแก้ไขเทมเพลตของตัวเองได้
- ตั้งค่า Public/Private และ Allow Copy
- จัดการหมวดหมู่ แท็ก และ API Key ของตัวเอง

### 3.3 ผู้เยี่ยมชม (Guest)
- ดูเทมเพลต Public และใช้ Generate PDF ได้
- ไม่สามารถสร้าง/แก้ไขเทมเพลต

---

## 4. วิธีใช้งาน Dashboard (หน้าแรก)

- **Sidebar**: กรองเทมเพลตตาม Department, User, Category (รองรับหมวดหมู่ย่อย)
- **Search & Tags**: ค้นหาและกรองด้วยแท็ก
- **Template Card**: พรีวิว, Edit, Generate, Duplicate, Settings
- **มุมมอง**: สลับระหว่าง Grid (รูปภาพ) และ List (รายการ)

---

## 5. วิธีใช้งานทีละขั้นตอน (Step-by-Step Guide)

### 5.1 การสร้างและแก้ไขเทมเพลต
1. คลิก **"Create New Template"** ที่ Dashboard
2. เลือกเพิ่มองค์ประกอบจากแถบเครื่องมือด้านบน (Text, Image, Table, Shape ฯลฯ)
3. คลิกที่องค์ประกอบเพื่อปรับค่าในแถบ **Properties** ด้านขวา
4. ลากขอบซ้ายของ Properties panel เพื่อขยาย/ย่อความกว้างได้
5. ใช้ **Ctrl+Click** หรือ **Shift+Click** เพื่อเลือกหลาย element พร้อมกัน
6. กด **Ctrl+S** เพื่อบันทึก

### 5.2 การใช้งาน Rich Text (เนื้อหาแบบ Block)

Rich Text ช่วยให้สร้างเนื้อหาที่ซับซ้อนได้ภายใน Text element เดียว:

1. สร้าง Text element แล้วเปิดสวิตช์ **"Rich Text"** ในแถบ Content
2. คลิก dropdown **"+ เพิ่ม..."** เพื่อเพิ่ม Block:
   - **ย่อหน้า**: ข้อความปกติ
   - **หัวข้อ H1/H2/H3**: หัวข้อขนาดต่างๆ
   - **รายการ (List)**: เลือกรูปแบบได้หลายแบบ

#### รูปแบบรายการที่รองรับ

| ประเภท | รูปแบบ | ตัวอย่าง |
|--------|--------|---------|
| Unordered | Disc, Circle, Square, Dash, Arrow, Check | ● ○ ■ – ▸ ✓ |
| Ordered | Decimal, Zero-padded, Alpha, Roman, Thai | 1. 01. a. i. ๑. |
| Interactive | Checkbox, Radio | ☑ ☐ ◉ ○ |

#### การใช้งาน Checkbox / Radio

1. เพิ่ม List แบบ **☑ Checkbox** หรือ **◉ Radio**
2. พิมพ์ข้อความในแต่ละรายการ
3. คลิกไอคอน ☐/○ หน้ารายการเพื่อสลับสถานะ เช็ค/ไม่เช็ค
4. **Checkbox**: เลือกได้หลายตัว
5. **Radio**: เลือกได้ตัวเดียว (คลิกตัวใหม่จะยกเลิกตัวเก่า)

#### การใช้ Dynamic Data กับ List

1. ติ๊ก **"Dynamic (ดึงจากตัวแปร)"**
2. กำหนด:
   - **Data Key**: ชื่อ key ใน JSON ที่เป็น array เช่น `features`
   - **Item Template**: รูปแบบข้อความ เช่น `{{.}}` หรือ `{{name}} - {{qty}}`
   - **Checked Key** (เฉพาะ Checkbox/Radio): ชื่อ key ที่เก็บค่าที่เลือก

ตัวอย่าง JSON สำหรับ Dynamic List:
```json
{
  "features": ["รวดเร็ว", "ปลอดภัย", "ใช้ง่าย"]
}
```

ตัวอย่าง JSON สำหรับ Checkbox/Radio:
```json
{
  "options": ["เห็นด้วย", "ไม่เห็นด้วย", "งดออกเสียง"],
  "selected": ["เห็นด้วย"]
}
```

หรือแบบ Object:
```json
{
  "options": [
    { "name": "ตัวเลือก A", "checked": true },
    { "name": "ตัวเลือก B", "checked": false },
    { "name": "ตัวเลือก C", "checked": true }
  ]
}
```

### 5.3 การจัดการตัวแปร (Variable Management)

1. คลิกที่พื้นที่ว่างบน Canvas (ไม่เลือก element ใดๆ)
2. ที่แถบด้านขวาจะพบส่วน **"Variables"**
3. คลิก **"+ Add"** เพื่อเพิ่มตัวแปร
4. คลิกที่ตัวแปรเพื่อ expand ดูรายละเอียด:
   - **ชื่อตัวแปร**: ต้องตรงกับชื่อใน JSON และ `{{ }}`
   - **ประเภท**: String, Number, Date, Boolean, Image (base64), Array, Object
   - **ค่าเริ่มต้น**: แสดงเมื่อไม่มีข้อมูลส่งเข้ามา
   - **คำอธิบาย**: อธิบายการใช้งาน (ไม่บังคับ)
5. ใช้ช่องค้นหาเพื่อหาตัวแปรเมื่อมีจำนวนมาก
6. ลาก ⋮⋮ เพื่อเรียงลำดับตัวแปร
7. กด **Ctrl+S** เพื่อบันทึก

### 5.4 การใช้งานตาราง (Table)

ระบบรองรับตาราง 2 แบบ:

#### Data Table (ข้อมูลจาก API)
1. เพิ่มจาก Toolbar → Table → **Data Table**
2. กำหนด **Data Key** เช่น `items` (ชื่อ key ใน JSON ที่เป็น array)
3. กำหนด Columns (key, label, width, alignment)
4. เมื่อ Generate PDF ส่ง JSON เข้ามา ระบบจะสร้างแถวอัตโนมัติ
5. ถ้าข้อมูลเกินหน้า จะ page break อัตโนมัติ (เปิด "Repeat header on new page" ได้)

#### Static Table (ข้อมูลคงที่)
1. เพิ่มจาก Toolbar → Table → **Simple Grid**
2. ในแถบ Properties จะแสดงปุ่ม **"Static"** (เลือกอยู่แล้ว)
3. คลิก **"+ Row"** เพื่อเพิ่มแถว
4. กรอกข้อมูลในแต่ละ cell โดยตรง
5. ข้อมูลจะแสดงบน canvas ทันทีและ render ใน PDF ตามที่กรอก

สลับระหว่าง Static ↔ Dynamic ได้ตลอดเวลาจากปุ่มในแถบ Properties

### 5.5 การใช้ AI Assistant
คลิกปุ่ม **"AI Assistant"** กรอกคำสั่ง เช่น *"สร้างตารางรายการสินค้า 5 คอลัมน์ สีหัวตารางเขียว"* แล้วกด **Generate**

### 5.6 การตั้งค่า Header/Footer และเลขหน้า
1. ไปที่แถบ **"H/F"** ด้านขวา
2. เปิด **"Enabled"** สำหรับ Header หรือ Footer
3. เปิด **"Apply to all pages"** เพื่อใช้กับทุกหน้า
4. ลากวาง Text, Image, Shape ลงในพื้นที่ Header/Footer
5. ตั้งค่าเลขหน้าในแท็บ **"Page No."** เลือกรูปแบบ ตำแหน่ง และสไตล์

### 5.7 การจัดการข้อมูลเทมเพลต (Info Tab)
- **Description**: คำอธิบายเทมเพลต
- **Category & Tags**: จัดหมวดหมู่และแท็ก
- **Visibility**: Private (เฉพาะตัวเอง) / Public (ทุกคนเห็น)
- **Allow Copy**: อนุญาตให้ผู้อื่นคัดลอก
- **API Keys**: สร้าง/ลบ API Key สำหรับเรียกใช้จากภายนอก

### 5.8 การ Preview PDF
1. กดปุ่ม **"Preview"** ใน Editor
2. ระบบจะสร้าง mock data อัตโนมัติจาก Variables และ Table dataKeys
3. กดปุ่ม ⛶ เพื่อดูแบบ **Fullscreen** กดอีกทีเพื่อกลับ
4. ในหน้า Generate View ก็มีปุ่ม Fullscreen เช่นกัน

### 5.9 การพิมพ์เอกสาร (Generate PDF)
1. ไปที่หน้า **Generate PDF** (จากปุ่มบน Card หรือใน Editor)
2. ใส่ข้อมูล JSON (กด **"Sample"** เพื่อโหลดตัวอย่าง)
3. กด **Preview** เพื่อดูผลลัพธ์
4. กด **Download PDF** เพื่อบันทึกไฟล์
5. คัดลอก **cURL Example** สำหรับใช้ใน API

---

## 6. คู่มือ Admin Panel

เข้าถึงได้ที่เมนู **"Admin Panel"** (เฉพาะ Admin role)

### 6.1 จัดการผู้ใช้งาน (Users)
- เพิ่ม/แก้ไข/ลบ user
- กำหนด role (Admin/User) และ Department
- Reset password (user จะถูกบังคับเปลี่ยนรหัสผ่านเมื่อ login ครั้งถัดไป)
- Enable/Disable account
- ค้นหาและเรียงลำดับได้

### 6.2 จัดการหน่วยงาน (Departments)
- เพิ่ม/แก้ไข/ลบ department
- ใช้สำหรับจัดกลุ่ม user และกรองเทมเพลตบน Dashboard

### 6.3 ตั้งค่า AI Provider
- เลือก provider ที่ต้องการใช้: Gemini, OpenAI/DeepSeek, Anthropic Claude, OpenRouter, Local LLM
- กำหนด API Key และ Model Name สำหรับแต่ละ provider
- เลือก **Active** เพื่อกำหนด provider หลัก
- บันทึกแล้วมีผลทันทีไม่ต้อง restart

### 6.4 จัดการฟอนต์ (Font Management)

#### ดูรายการฟอนต์
- แสดงฟอนต์ทั้งหมดในระบบ (ชื่อ, Key, ภาษา, Variants, สถานะ)
- ค้นหาฟอนต์ได้
- ฟอนต์ Builtin (Helvetica, Times, Courier) จะมี badge แสดง

#### เพิ่มฟอนต์ใหม่
1. คลิกปุ่ม **"Upload Font"**
2. เลือกไฟล์ `.ttf` หรือ `.otf`
3. ระบบจะโหลดฟอนต์เข้าใช้งานทันที

**รูปแบบการตั้งชื่อไฟล์**: `[ชื่อFont]-[Style].ttf`

| Style | คำอธิบาย |
|-------|---------|
| Regular | ตัวปกติ (จำเป็น) |
| Bold | ตัวหนา |
| Italic | ตัวเอียง |
| BoldItalic | ตัวหนา+เอียง |

**ตัวอย่าง**: เพิ่มฟอนต์ Sarabun
```
Sarabun-Regular.ttf    ← ตัวปกติ (จำเป็น)
Sarabun-Bold.ttf       ← ตัวหนา
Sarabun-Italic.ttf     ← ตัวเอียง
Sarabun-BoldItalic.ttf ← ตัวหนา+เอียง
```

Upload ทีละไฟล์ ระบบจะจับกลุ่มให้อัตโนมัติจากชื่อ font
ถ้ามีแค่ไฟล์เดียว (เช่น `MyFont.ttf`) ระบบจะใช้ไฟล์นั้นสำหรับทุก style

> แนะนำดาวน์โหลดฟอนต์จาก [Google Fonts](https://fonts.google.com) — เลือก font แล้วกด "Download family"

#### ซ่อน/แสดงฟอนต์
- คลิกไอคอน 👁 เพื่อซ่อนฟอนต์ (จะไม่แสดงใน Editor แต่ยัง render PDF ได้)
- คลิกอีกทีเพื่อแสดงกลับ

#### ลบฟอนต์
- คลิกไอคอนถังขยะเพื่อลบ custom font
- ฟอนต์ Builtin (Helvetica, Times, Courier) ลบไม่ได้

#### Reload ฟอนต์
- คลิกปุ่ม **"Reload"** เพื่อโหลดฟอนต์จาก disk ใหม่ (กรณีเพิ่มไฟล์ด้วยตัวเอง)

---

## 7. คู่มือการใช้งาน API (External API Guide)

### 7.1 การยืนยันตัวตน (Authentication)
ส่ง **API Key** ผ่าน HTTP Header `X-API-Key`

> API Key ขึ้นต้นด้วย `sk_` เสมอ สร้างได้จากแถบ Info ของเทมเพลต

### 7.2 รูปแบบผลลัพธ์

| รูปแบบ | สิ่งที่ได้รับ | เมื่อไหร่ควรใช้ |
|--------|-------------|----------------|
| PDF Binary (ค่าเริ่มต้น) | ไฟล์ PDF โดยตรง | ดาวน์โหลดไฟล์ทันที |
| Base64 JSON | `{ "base64": "..." }` | นำไปประมวลผลต่อในโค้ด |

### 7.3 ตัวอย่าง cURL

**รับเป็นไฟล์ PDF:**
```bash
curl -X POST "http://localhost:3000/templates/YOUR_TEMPLATE_ID/generate" \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
           "name": "สมชาย ใจดี",
           "items": [
             { "name": "สินค้า A", "qty": 5, "price": "500.00" },
             { "name": "สินค้า B", "qty": 3, "price": "750.00" }
           ]
         }' \
     --output document.pdf
```

**รับเป็น Base64 JSON:**
```bash
curl -X POST "http://localhost:3000/templates/YOUR_TEMPLATE_ID/generate" \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
           "responseType": "base64",
           "name": "สมชาย ใจดี"
         }'
```

### 7.4 ตัวอย่าง JSON สำหรับ Dynamic Data

**ข้อมูลพื้นฐาน:**
```json
{
  "companyName": "บริษัท ตัวอย่าง จำกัด",
  "customerName": "สมชาย ใจดี",
  "date": "15/03/2026",
  "totalAmount": 12500
}
```

**ข้อมูลตาราง (Data Table):**
```json
{
  "items": [
    { "name": "สินค้า A", "qty": 5, "price": "500.00", "total": "2,500.00" },
    { "name": "สินค้า B", "qty": 3, "price": "750.00", "total": "2,250.00" }
  ]
}
```

**ข้อมูล List (Dynamic):**
```json
{
  "features": ["รวดเร็ว", "ปลอดภัย", "ใช้ง่าย"]
}
```

**ข้อมูล Checkbox/Radio:**
```json
{
  "options": ["เห็นด้วย", "ไม่เห็นด้วย", "งดออกเสียง"],
  "selected": ["เห็นด้วย"]
}
```

**ข้อมูลรูปภาพ (base64):**
```json
{
  "signature": "data:image/png;base64,iVBORw0KGgo..."
}
```

---

## 8. คีย์ลัด (Keyboard Shortcuts)

| คีย์ลัด | การทำงาน |
|---------|---------|
| Ctrl+S | บันทึกเทมเพลต |
| Ctrl+Z | Undo (ย้อนกลับ) |
| Ctrl+Y | Redo (ทำซ้ำ) |
| Ctrl+D | Duplicate element |
| Ctrl+G | Group elements ที่เลือก |
| Ctrl+Shift+G | Ungroup |
| Ctrl+Click | เลือกหลาย element |
| Shift+Click | เลือกหลาย element |
| Delete | ลบ element ที่เลือก |
| Escape | ยกเลิกการเลือก |
| Double-click | แก้ไขข้อความ inline |
| Arrow keys | เลื่อน element (1px) |
| Shift+Arrow | เลื่อน element (10px) |

---

## 9. คำถามที่พบบ่อย (FAQ)

**Q: ตารางแสดงข้อมูลไม่ครบ เกินหน้ากระดาษ?**
A: คลิกที่ตาราง → เปิด **"Repeat header on new page"** ระบบจะ page break อัตโนมัติ

**Q: ฟอนต์ไทยไม่แสดงใน PDF?**
A: ตรวจสอบว่าเลือกฟอนต์ไทย (Sarabun, Kanit, Prompt ฯลฯ) ไม่ใช่ Helvetica ซึ่งไม่รองรับภาษาไทย

**Q: Checkbox/Radio ไม่แสดงเครื่องหมายใน PDF?**
A: ตรวจสอบว่าได้คลิก toggle สถานะ checked ที่หน้า editor แล้ว หรือถ้าใช้ Dynamic ต้องส่ง `checked: true` ใน JSON

**Q: รูปภาพไม่แสดงใน PDF?**
A: ตรวจสอบขนาดไฟล์ (ไม่ควรเกิน 2MB) และกด Save หลังอัปโหลด

**Q: Preview แสดงไม่ตรงกับ Editor?**
A: กด **Save** ก่อน Preview เสมอ ระบบจะ generate จากข้อมูลที่บันทึกล่าสุด

**Q: เพิ่มฟอนต์ใหม่แล้วไม่เห็นใน Editor?**
A: ไปที่ Admin Panel → Font Management → ตรวจสอบว่าฟอนต์ไม่ได้ถูกซ่อน (Hidden) ถ้าเพิ่มไฟล์ด้วยตัวเอง ให้กด Reload

**Q: Static Table กับ Data Table ต่างกันอย่างไร?**
A: Static Table กำหนดข้อมูลตายตัวใน editor เหมาะกับตารางราคา/spec ส่วน Data Table ดึงข้อมูลจาก JSON ผ่าน API เหมาะกับใบเสร็จ/รายงาน

---

## 10. ขนาดกระดาษที่รองรับ

| ขนาด | พิกเซล (pt) |
|------|-------------|
| A4 | 595.28 × 841.89 |
| A3 | 841.89 × 1190.55 |
| Letter | 612 × 792 |
| Legal | 612 × 1008 |
| Custom | กำหนดเอง |

รองรับทั้ง Portrait (แนวตั้ง) และ Landscape (แนวนอน)

---

## 11. ฟอนต์ไทยที่มีในระบบ

Sarabun, Kanit, Prompt, Mitr, Noto Sans Thai, Chakra Petch, Trirong

เพิ่มเติมได้ผ่าน Admin Panel → Font Management

> **เคล็ดลับ**: สลับมุมมอง Dashboard ระหว่าง Grid และ List ได้ที่มุมขวาบน
