import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

// Definește tipul pentru rezultat
interface UserLastIp {
  last_ip: string | null;
}

export async function GET(request: Request) {
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

    // Verifică doar last_ip - specifică tipul
    const result = db.prepare(
      'SELECT last_ip FROM users WHERE username = ?'
    ).get(userFromToken.username) as UserLastIp | undefined;

    if (!result) {
      return NextResponse.json({ success: false, error: 'Utilizator inexistent' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      isFirstLogin: result.last_ip === null || result.last_ip === undefined
    });

  } catch (error) {
    console.error('Error checking first login:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Eroare la verificarea primei conectări' 
    }, { status: 500 });
  }
}