import db from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../../lib/auth';

type FileRow = {
    file_name: string;
    file_content: Buffer;
    user_id: string;
    stage: string;
};

// GET: Descărcare fișier sau info fișier
export async function GET(req: NextRequest, context: any) {
    const token = req.cookies.get('authToken')?.value;
    const authUser = verifyToken(token);

    if (!authUser) {
        return NextResponse.json({ error: 'Nu ai voie!' }, { status: 403 });
    }

    const params = await context.params;
    const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);

    if (isNaN(id) || id <= 0) {
        return NextResponse.json({ error: 'ID invalid' }, { status: 400 });
    }

    const file = db.prepare(
        'SELECT file_name, file_content, user_id, stage FROM files WHERE id = ?'
    ).get(id) as FileRow | undefined;

    if (!file) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Permite admin, moderator sau owner
    if (
        !authUser.is_admin &&
        !authUser.is_moderator &&
        authUser.username.trim().toLowerCase() !== String(file.user_id).trim().toLowerCase()
    ) {
        return NextResponse.json({ error: 'Nu ai voie să descarci acest fișier!' }, { status: 403 });
    }

    // Dacă vrei doar info (nu download), apelează cu ?info=1
    if (req.nextUrl.searchParams.get('info') === '1') {
        return NextResponse.json({
            file_name: file.file_name,
            user_id: file.user_id,
            stage: file.stage,
        });
    }

    // Trimite fișierul ca attachment (oricare ar fi tipul)
    return new NextResponse(new Uint8Array(file.file_content), {
        status: 200,
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.file_name)}"`,
            'X-File-Stage': file.stage || 'Draft',
        },
    });
}

// PUT: Actualizare fișier și stage
export async function PUT(req: NextRequest, context: any) {
    const params = await context.params;
    const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);
    if (isNaN(id) || id <= 0) {
        return NextResponse.json({ error: 'ID invalid' }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const stage = formData.get('stage') as string | null;

    if (!file) {
        return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    db.prepare(
        'UPDATE files SET file_content = ?, stage = ? WHERE id = ?'
    ).run(buffer, stage || 'Draft', id);

    return NextResponse.json({ success: true });
}

// DELETE: Ștergere fișier
export async function DELETE(req: NextRequest, context: any) {
    const params = await context.params;
    const id = Number(Array.isArray(params.id) ? params.id[0] : params.id);

    if (isNaN(id) || id <= 0) {
        return NextResponse.json({ error: 'ID invalid' }, { status: 400 });
    }

    db.prepare('DELETE FROM files WHERE id = ?').run(id);

    return NextResponse.json({ success: true });
}