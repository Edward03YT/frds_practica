import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(process.cwd(), 'database.sqlite');

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const params = await context.params; // Await the params Promise
  
  try {
    // 1. Verifică autentificarea
    const cookieStore = await cookies();
    let token = cookieStore.get('authToken')?.value;

    // Fallback: caută în header Authorization
    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ success: false, error: 'Neautentificat' }, { status: 401 });
    }

    const userFromToken = verifyToken(token);
    if (!userFromToken) {
      return NextResponse.json({ success: false, error: 'Token invalid' }, { status: 401 });
    }

    // 2. Verifică dacă userul logat e admin
    const db = new Database(dbPath);
    const admin = db.prepare('SELECT is_admin FROM users WHERE username = ?').get(userFromToken.username) as { is_admin: number } | undefined;
    if (!admin || !admin.is_admin) {
      db.close();
      return NextResponse.json({ success: false, error: 'Doar adminul poate schimba parola altui user!' }, { status: 403 });
    }

    // 3. Preia noua parolă din body
    const { newPassword } = await request.json();
    if (!newPassword || newPassword.length < 8) {
      db.close();
      return NextResponse.json({ success: false, error: 'Parola trebuie să aibă minim 8 caractere.' }, { status: 400 });
    }

    // 4. Verifică dacă userul există
    const user = db.prepare('SELECT id FROM users WHERE id = ?').get(params.id) as { id: number } | undefined;
    if (!user) {
      db.close();
      return NextResponse.json({ success: false, error: 'Utilizatorul nu există.' }, { status: 404 });
    }

    // 5. Hash-uiește și salvează noua parolă
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, params.id);

    db.close();
    return NextResponse.json({ success: true, message: 'Parola a fost schimbată cu succes!' });
  } catch (error) {
    console.error('Eroare la schimbarea parolei de către admin:', error);
    return NextResponse.json({ success: false, error: 'Eroare internă de server' }, { status: 500 });
  }
}