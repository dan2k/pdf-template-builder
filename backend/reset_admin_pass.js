const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

const NEW_PASSWORD = 'admin@1234';
const USERNAME = 'admin';

async function resetPassword() {
    const db = new Database('D:/test/pdf-template-system3/backend/data/pdf_templates.db');
    const hash = await bcrypt.hash(NEW_PASSWORD, 10);
    const result = db.prepare("UPDATE users SET passwordHash = ? WHERE username = ?").run(hash, USERNAME);
    console.log(`Updated ${result.changes} row(s). New password for '${USERNAME}' is: ${NEW_PASSWORD}`);
    db.close();
}

resetPassword().catch(console.error);
