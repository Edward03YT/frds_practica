import db from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  // Extrage tokenul din cookie
  let token: string | undefined = undefined;
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/authToken=([^;]+)/);
    if (match) {
      try {
        token = decodeURIComponent(match[1]);
      } catch (error) {
        return NextResponse.json({ error: 'Token invalid' }, { status: 401 });
      }
    }
  }
  if (!token) {
    return NextResponse.json({ error: 'Neautentificat - token lipsă' }, { status: 401 });
  }

  let user;
  try {
    user = verifyToken(token);
  } catch (error) {
    return NextResponse.json({ error: 'Token invalid sau expirat' }, { status: 401 });
  }

  // ADMIN: poate vedea tot dacă userId=ALL
  if (user.role === 'admin' && userId === 'ALL') {
    const files = db.prepare(
      'SELECT id, file_name, uploaded_at, user_id FROM files ORDER BY uploaded_at DESC'
    ).all();
    return NextResponse.json(files);
  }

  // ADMIN: poate vedea fișierele oricărui user
  if (user.role === 'admin') {
    const files = db.prepare(
      'SELECT id, file_name, uploaded_at, user_id FROM files WHERE user_id = ? ORDER BY uploaded_at DESC'
    ).all(userId);
    return NextResponse.json(files);
  }

  // USER: poate vedea DOAR fișierele sale
  if (user.username !== userId) {
    return NextResponse.json({ error: 'Nu ai voie să vezi fișierele altui utilizator!' }, { status: 403 });
  }

  const files = db.prepare(
    'SELECT id, file_name, uploaded_at, user_id FROM files WHERE user_id = ? ORDER BY uploaded_at DESC'
  ).all(userId);

  return NextResponse.json(files);
}