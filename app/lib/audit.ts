// lib/audit.ts
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Asigură-te că ai coloana timestamp în tabelul Audit!
export function logAudit(user: string, actiune: string, mesaj: string): void {
    try {
        // Obține data și ora locală pentru România
        const now = new Date();
        // Formatăm data în stil SQL: YYYY-MM-DD HH:mm:ss
        const roDate = now.toLocaleString('sv-SE', { timeZone: 'Europe/Bucharest' }).replace('T', ' ');

        const stmt = db.prepare<[string, string, string, string]>(
            'INSERT INTO Audit ("user", "Actiune", "MESAJ", "timestamp") VALUES (?, ?, ?, ?)'
        );
        stmt.run(user, actiune, mesaj, roDate);
    } catch (e) {
        console.error('Eroare la logAudit:', e);
    }
}