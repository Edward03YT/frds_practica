import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

export async function POST(request: Request) {
  try {
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

    // Obține IP-ul clientului
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    // Actualizează last_ip și last_login în baza de date
    const updateStmt = db.prepare(`
      UPDATE users 
      SET last_ip = ?, 
          last_login = datetime('now') 
      WHERE username = ?
    `);
    
    const result = updateStmt.run(clientIp, userFromToken.username);

    if (result.changes === 0) {
      return NextResponse.json({ success: false, error: 'Utilizator inexistent' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'IP actualizat cu succes',
      ip: clientIp 
    });

  } catch (error) {
    console.error('Error updating last IP:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare la actualizarea IP-ului' 
    }, { status: 500 });
  }
}