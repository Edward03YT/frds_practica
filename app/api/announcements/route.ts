import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { verifyToken } from '../../lib/auth'; // ajustează calea dacă e nevoie

const dbPath = path.join(process.cwd(), "database.sqlite");

// ===================== GET =====================
// Oricine poate vedea anunțurile generale
export async function GET(request: NextRequest) {
  const db = new Database(dbPath);
  try {
    const anns = db.prepare('SELECT id, text, created_at FROM announcements ORDER BY id DESC').all();
    return NextResponse.json({ success: true, announcements: anns });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Eroare la citire anunțuri' }, { status: 500 });
  } finally {
    db.close();
  }
}

// ===================== POST =====================
// Doar admin poate adăuga anunțuri
export async function POST(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Nu ai voie!" }, { status: 403 });
  }
  const { text } = await request.json();
  if (!text || typeof text !== "string" || text.length > 1000) {
    return NextResponse.json({ success: false, error: "Text lipsă sau prea lung" }, { status: 400 });
  }
  const db = new Database(dbPath);
  try {
    db.prepare('INSERT INTO announcements (text, created_at) VALUES (?, datetime(\'now\'))').run(text);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('Eroare la adăugare anunț:', e);
    return NextResponse.json({ success: false, error: 'Eroare la adăugare' }, { status: 500 });
  } finally {
    db.close();
  }
}

// ===================== DELETE =====================
// Doar admin poate șterge anunțuri
export async function DELETE(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const user = verifyToken(token);
  if (!user || user.role !== "admin") {
    return NextResponse.json({ success: false, error: "Nu ai voie!" }, { status: 403 });
  }
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ success: false, error: "ID lipsă" }, { status: 400 });
  }
  const db = new Database(dbPath);
  try {
    db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Eroare la ștergere' }, { status: 500 });
  } finally {
    db.close();
  }
}