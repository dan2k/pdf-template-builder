const Database = require('better-sqlite3');
const db = new Database('D:/test/pdf-template-system3/backend/data/pdf_templates.db');
const r = db.prepare("DELETE FROM templates WHERE name LIKE '%(Copy) (Copy)%'").run();
console.log('Cleaned up:', r.changes, 'extra test copies');
db.prepare('SELECT name FROM templates').all().forEach(t => console.log(' -', t.name));
db.close();
