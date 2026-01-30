// lib/db.ts

// Creează tabela dacă nu există
import Database from 'better-sqlite3';

const db = new Database('./database.sqlite');

db.exec(`
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    file_name TEXT,
    file_content BLOB,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    stage VARCHAR(20)
  );
`);

export function getFilesWithRomaniaTime() {
  // +2 hours (atenție, nu ține cont de ora de vară!)
  return db.prepare(`
    SELECT *, datetime(uploaded_at, '+2 hours') as uploaded_at_ro
    FROM files
  `).all();
}

export default db;