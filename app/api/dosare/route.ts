import db from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { userId, denumire, autoritate, tip, numarAnunt } = body;

        if (!userId || !denumire || !autoritate || !tip || !numarAnunt) {
            return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
        }

        const result = db.prepare(
            'INSERT INTO dosare (user_id, denumire, autoritate, tip, numar_anunt) VALUES (?, ?, ?, ?, ?)'
        ).run(userId, denumire, autoritate, tip, numarAnunt);

        return NextResponse.json({ success: true, dosarId: result.lastInsertRowid });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const dosare = db.prepare(
            'SELECT * FROM dosare WHERE user_id = ? ORDER BY created_at DESC'
        ).all(userId);

        return NextResponse.json({ dosare });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
