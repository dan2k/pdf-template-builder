/**
 * Fix: Remove the global UNIQUE constraint on categories.name
 * SQLite doesn't support DROP CONSTRAINT, so we must recreate the table.
 * The constraint should be scoped to (name + userId + parentId) per user.
 */
const Database = require('better-sqlite3');
const db = new Database('D:/test/pdf-template-system3/backend/data/pdf_templates.db');

db.transaction(() => {
    // 1. Rename old table
    db.prepare('ALTER TABLE categories RENAME TO categories_old').run();

    // 2. Create new table WITHOUT the global UNIQUE on name
    //    (no unique constraint - the service layer handles per-user uniqueness)
    db.prepare(`
    CREATE TABLE "categories" (
      "id" varchar PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "color" varchar NOT NULL DEFAULT ('#1a56db'),
      "createdAt" datetime NOT NULL DEFAULT (datetime('now')),
      "updatedAt" datetime NOT NULL DEFAULT (datetime('now')),
      "userId" varchar,
      "parentId" varchar,
      CONSTRAINT "FK_categories_userId" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION,
      CONSTRAINT "FK_categories_parentId" FOREIGN KEY ("parentId") REFERENCES "categories" ("id") ON DELETE CASCADE ON UPDATE NO ACTION
    )
  `).run();

    // 3. Copy data over
    const rows = db.prepare('SELECT * FROM categories_old').all();
    const insert = db.prepare('INSERT INTO categories (id, name, color, createdAt, updatedAt, userId, parentId) VALUES (?,?,?,?,?,?,?)');
    for (const r of rows) {
        insert.run(r.id, r.name, r.color, r.createdAt, r.updatedAt, r.userId, r.parentId);
    }

    // 4. Drop old table
    db.prepare('DROP TABLE categories_old').run();

    console.log(`Migrated ${rows.length} categories. Global UNIQUE constraint on 'name' removed.`);
})();

db.close();
