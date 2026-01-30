import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

export async function GET(request: Request) {
  const cookieStore = await cookies();
  let token = cookieStore.get('authToken')?.value;

  // Fallback 1: caută în header Authorization
  if (!token) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // Fallback 2: caută manual în cookie header
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/authToken=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }

  // Fallback 3: verifică dacă token-ul e în URL (pentru teste)
  if (!token) {
    return NextResponse.json({ success: false, error: 'Neautentificat' }, { status: 401 });
  }

  const userFromToken = verifyToken(token);
  if (!userFromToken) {
    return NextResponse.json({ success: false, error: 'Token invalid' }, { status: 401 });
  }

  // SELECT complet din baza de date după username sau id
  const user = db.prepare(
    'SELECT id, username, name, email, is_admin, is_moderator, cod_proiect, telefon, judet, localitate FROM users WHERE username = ?'
  ).get(userFromToken.username);

  if (!user) {
    return NextResponse.json({ success: false, error: 'Utilizator inexistent' }, { status: 404 });
  }

  return NextResponse.json({ success: true, user });
}