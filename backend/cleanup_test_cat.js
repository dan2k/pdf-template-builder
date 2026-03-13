const db = require('better-sqlite3')('D:/test/pdf-template-system3/backend/data/pdf_templates.db');
const r = db.prepare("DELETE FROM categories WHERE id='449ce5ef-5a9d-418d-9237-ff4d05145b39'").run();
console.log('Cleanup test category:', r.changes, 'row(s) deleted');
db.close();
