import db from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type PdfFileRow = {
    file_name: string;
    file_content: Buffer | Uint8Array;
};

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const info = db.prepare('SELECT id FROM pdf_files WHERE id = ?').get(id) as { id: number } | undefined;
    if (!info) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    db.prepare('DELETE FROM pdf_files WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    if (!id) {
        return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }
    const file = db.prepare('SELECT file_name, file_content FROM pdf_files WHERE id = ?').get(id) as PdfFileRow | undefined;
    if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    const uint8 = Uint8Array.from(file.file_content as Buffer | Uint8Array);

    return new NextResponse(uint8, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(file.file_name)}"`,
        },
    });
}