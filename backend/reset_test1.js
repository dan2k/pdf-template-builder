const bcrypt = require('bcrypt');
const db = require('better-sqlite3')('D:/test/pdf-template-system3/backend/data/pdf_templates.db');

// Reset test1 password
const hash = bcrypt.hashSync('Test@1234', 10);
db.prepare("UPDATE users SET passwordHash=? WHERE username='test1'").run(hash);
console.log('test1 password reset to: Test@1234');
db.close();
