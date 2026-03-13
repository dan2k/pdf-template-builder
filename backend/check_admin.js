const Database = require('better-sqlite3');
const db = new Database('D:/test/pdf-template-system3/backend/data/pdf_templates.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name).join(', '));
const rows = db.prepare("SELECT id, username, role, isActive, passwordHash FROM users WHERE role='admin'").all();
console.log(JSON.stringify(rows, null, 2));
db.close();

