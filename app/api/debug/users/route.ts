import { NextResponse } from 'next/server';
import { getDb } from '@/app/db';

export async function GET() {
  try {
    const db = getDb();
    const users = db.prepare('SELECT * FROM users').all();
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Debug users error:', error);
    return NextResponse.json({ error: 'Database error' });
  }
}