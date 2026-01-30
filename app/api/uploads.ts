import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/app/db';

export async function POST(req: NextRequest) {
  const db = getDb();
  const { user_id, file_name, page } = await req.json();

  if (!user_id || !file_name || !page) {
    return NextResponse.json({ success: false, error: 'Date lipsă' }, { status: 400 });
  }

  db.prepare(`
    INSERT INTO uploads (user_id, file_name, page)
    VALUES (?, ?, ?)
  `).run(user_id, file_name, page);

  return NextResponse.json({ success: true });
}
