const Database = require('better-sqlite3');
const db = new Database('D:/test/pdf-template-system3/backend/data/pdf_templates.db');
const adminId = 'c7951acb-263b-4d2b-9520-5efaa3c80e33';

// Assign orphan templates (userId=null) to admin
const r = db.prepare('UPDATE templates SET userId=? WHERE userId IS NULL').run(adminId);
console.log('Updated rows:', r.changes);

// Show all templates now
const templates = db.prepare('SELECT name, userId, category, visibility FROM templates').all();
templates.forEach(t => console.log(' -', t.name, '| userId:', t.userId, '| cat:', t.category, '| vis:', t.visibility));

db.close();
