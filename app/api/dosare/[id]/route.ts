import db from '../../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest, context: any) {
    try {
        const params = await context.params;
        const id = params.id;
        if (!id) {
            return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        }
        const result = db.prepare('DELETE FROM dosare WHERE id = ?').run(id);
        if (result.changes === 0) {
            return NextResponse.json({ error: 'No record found to delete' }, { status: 404 });
        }
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}