import db from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const userId = formData.get('userId') as string | null;
    const dosarId = formData.get('dosarId') as string | null;
    const description = formData.get('description') as string | null;

    if (!file || !userId || !dosarId) {
        return NextResponse.json({ error: 'Missing file, userId or dosarId' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Unicitate pe user, dosar, file_name
    db.prepare(
        'INSERT OR REPLACE INTO pdf_files (user_id, dosar_id, file_name, file_content, description, uploaded_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)'
    ).run(userId, dosarId, file.name, buffer, description);

    return NextResponse.json({ success: true });
}

export async function GET(req: NextRequest) {
    const dosarId = req.nextUrl.searchParams.get('dosarId');
    if (!dosarId) {
        return NextResponse.json({ error: 'Missing dosarId' }, { status: 400 });
    }
    const files = db.prepare(
        'SELECT id, file_name, uploaded_at, description FROM pdf_files WHERE dosar_id = ?'
    ).all(dosarId);
    return NextResponse.json({ files });
}