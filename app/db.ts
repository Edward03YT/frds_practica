import Database from 'better-sqlite3';
import path from 'path';

// Calea către fișierul bazei de date
const dbPath = path.join(process.cwd(), 'database.sqlite');

// Instanță singleton pentru conexiunea la baza de date
let db: Database.Database | null = null;

/**
 * Verifică dacă baza de date există și are tabelele necesare
 */
export function checkDatabaseExists(): boolean {
  try {
    const testDb = new Database(dbPath);
    
    // Verifică dacă tabelul users există
    const result = testDb.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='users'
    `).get();
    
    testDb.close();
    return !!result;
  } catch (error) {
    console.log('❌ Baza de date nu există sau nu are tabelele necesare');
    return false;
  }
}

/**
 * Obține conexiunea la baza de date (singleton pattern)
 */
export function getDb(): Database.Database {
  if (!db) {
    try {
      // Verifică dacă baza de date există
      if (!checkDatabaseExists()) {
        throw new Error('Baza de date nu a fost inițializată. Rulează: npm run db:init');
      }
      
      db = new Database(dbPath);
      
      // Activează foreign keys
      db.pragma('foreign_keys = ON');
      
      // Setează jurnalul în modul WAL pentru performanță mai bună
      db.pragma('journal_mode = WAL');
      
      console.log('✅ Conexiune la baza de date SQLite stabilită');
    } catch (error) {
      console.error('❌ Eroare la conectarea la baza de date:', error);
      throw error;
    }
  }
  
  return db;
}

/**
 * Închide conexiunea la baza de date
 */
export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log('🔒 Conexiunea la baza de date a fost închisă');
  }
}

/**
 * Execută o interogare de selecție
 */
export function selectQuery<T = any>(query: string, params: any[] = []): T[] {
  const database = getDb();
  try {
    const stmt = database.prepare(query);
    return stmt.all(params) as T[];
  } catch (error) {
    console.error('❌ Eroare la executarea interogării SELECT:', error);
    throw error;
  }
}

/**
 * Execută o interogare de inserare/actualizare/ștergere
 */
export function executeQuery(query: string, params: any[] = []): Database.RunResult {
  const database = getDb();
  try {
    const stmt = database.prepare(query);
    return stmt.run(params);
  } catch (error) {
    console.error('❌ Eroare la executarea interogării:', error);
    throw error;
  }
}

/**
 * Execută o tranzacție
 */
export function executeTransaction(queries: Array<{ query: string; params?: any[] }>): void {
  const database = getDb();
  const transaction = database.transaction(() => {
    for (const { query, params = [] } of queries) {
      const stmt = database.prepare(query);
      stmt.run(params);
    }
  });
  
  try {
    transaction();
    console.log('✅ Tranzacția a fost executată cu succes');
  } catch (error) {
    console.error('❌ Eroare la executarea tranzacției:', error);
    throw error;
  }
}

// Cleanup la închiderea aplicației
process.on('SIGINT', () => {
  closeDb();
  process.exit(0);
});

process.on('SIGTERM', () => {
  closeDb();
  process.exit(0);
});