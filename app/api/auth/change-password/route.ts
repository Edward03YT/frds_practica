import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/app/lib/auth';
import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

export async function POST(request: NextRequest) {
  try {
    // Folosește await la cookies() în route handler!
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

    if (!token) {
      return NextResponse.json({ success: false, error: 'Neautentificat' }, { status: 401 });
    }

    const userFromToken = verifyToken(token);
    if (!userFromToken) {
      return NextResponse.json({ success: false, error: 'Token invalid' }, { status: 401 });
    }

    // Tip explicit pentru user
    const user = db.prepare(
      'SELECT id, password FROM users WHERE username = ?'
    ).get(userFromToken.username) as { id: number, password: string } | undefined;

    if (!user) {
      return NextResponse.json({ success: false, error: 'Utilizatorul nu a fost găsit' }, { status: 404 });
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Toate câmpurile sunt obligatorii' }, { status: 400 });
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ success: false, error: 'Parola veche este incorectă' }, { status: 401 });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedNewPassword, user.id);

    return NextResponse.json({ success: true, message: 'Parola a fost schimbată cu succes' });
  } catch (error) {
    console.error('Eroare la schimbarea parolei:', error);
    return NextResponse.json({ success: false, error: 'Eroare internă de server' }, { status: 500 });
  }
}