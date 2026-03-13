# External API Usage Guide

This guide explains how to call the PDF Template System API from external applications using `curl`.

## Authentication
To call the API, you must have an **API Key** for the specific template you want to use.
The API Key should be passed in the `X-API-Key` HTTP header.

> [!IMPORTANT]
> API Keys are prefix with `sk_` and typically follow the format `sk_<id>.<secret>`.

## เลือกรูปแบบผลลัพธ์ (Response Type)

คุณสามารถเลือกได้ว่าจะให้ API คืนค่าเป็น **ไฟล์ PDF** หรือ **ข้อความ JSON (Base64)** ตามการใช้งาน:

| รูปแบบ | สิ่งที่จะได้รับ | เมื่อไหร่ที่ควรใช้ |
| :--- | :--- | :--- |
| **PDF Binary** (ค่าเริ่มต้น) | ไฟล์ PDF โดยตรง | เมื่อต้องการดาวน์โหลดไฟล์ทันที หรือใช้ `curl` ทดสอบ |
| **Base64 JSON** | ข้อความ JSON: `{ "base64": "..." }` | สำหรับนักพัฒนาที่ต้องการนำข้อมูลไปประมวลผลต่อใน Code |

---

### 1. รับเป็นไฟล์ PDF (แนะนำสำหรับการทดสอบ)

ไม่ต้องระบุ parameter พิเศษ ระบบจะส่งไฟล์ PDF กลับมาให้ทันที

```bash
curl -X POST "http://localhost:3000/templates/YOUR_TEMPLATE_ID/generate" \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
           "name": "John Doe"
         }' \
     --output document.pdf
```

### 2. รับเป็น JSON Base64 (สำหรับนักพัฒนา)

ต้องเพิ่ม `"responseType": "base64"` เข้าไปในข้อมูลที่ส่ง (JSON Body)

```bash
curl -X POST "http://localhost:3000/templates/YOUR_TEMPLATE_ID/generate" \
     -H "X-API-Key: YOUR_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
           "responseType": "base64",
           "name": "John Doe"
         }'
```

**ตัวอย่างผลลัพธ์ที่จะได้รับ:**
```json
{
  "base64": "JVBERi0xLjQKJ...",
  "filename": "generated-123456789.pdf",
  "contentType": "application/pdf"
}
```

---

### รายละเอียด Parameter:
- `X-API-Key`: (Header) คีย์ลับสำหรับเข้าถึง Template
- `responseType`: (Body) ระบุเป็น `"base64"` หากต้องการผลลัพธ์เป็น JSON (ถ้าไม่ใส่จะได้ไฟล์ PDF)
- **ตัวแปรอื่นๆ**: ใส่ตามชื่อตัวแปรที่ตั้งไว้ใน Template


## Preview PDF (Inline)

If you want to view the PDF directly without an API Key (for internal/public templates), use the preview endpoint:

```bash
curl -X POST "http://localhost:3000/templates/YOUR_TEMPLATE_ID/preview" \
     -H "Content-Type: application/json" \
     -d '{"name": "John Doe"}' \
     --output preview.pdf
```

> [!NOTE]
> The `/preview` endpoint does not require an API Key but might be restricted depending on the template's visibility settings.
