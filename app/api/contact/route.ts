// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Database from 'better-sqlite3';

// Creează/Deschide baza de date
const db = new Database('contact_messages.db');

// Creează tabela dacă nu există
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    firstName TEXT,
    lastName TEXT,
    email TEXT,
    subject TEXT,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export async function POST(req: NextRequest) {
  const data = await req.json();

  const { firstName, lastName, email, subject, message } = data;

  try {
    const stmt = db.prepare(`
      INSERT INTO messages (firstName, lastName, email, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(firstName, lastName, email, subject, message);

    return NextResponse.json({ success: true, message: 'Mesaj salvat cu succes' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, message: 'Eroare la salvare' }, { status: 500 });
  }
}
