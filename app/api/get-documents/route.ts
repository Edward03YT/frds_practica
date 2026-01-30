import { NextResponse, NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/auth'; // ajustează calea dacă e nevoie
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, { readonly: true });

interface DocumentRow {
    id: number;
    file_name: string;
    file_size: number;
    uploaded_at: string;
}

export async function GET(request: NextRequest) {
    // 1. Ia tokenul din cookie sau header, la fel ca în /api/me
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
        return NextResponse.json({ error: 'Neautentificat' }, { status: 401 });
    }

    const userFromToken = verifyToken(token);
    if (!userFromToken) {
        return NextResponse.json({ error: 'Token invalid' }, { status: 401 });
    }

    // 2. Ia username-ul din token
    const username = userFromToken.username;
    if (!username) {
        return NextResponse.json({ error: 'Token fără username' }, { status: 401 });
    }

    // 3. Ia parametrii din query
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (!section) {
        return NextResponse.json({ error: 'Numele secțiunii este obligatoriu' }, { status: 400 });
    }

    try {
        const stmt = db.prepare(
            `SELECT id, file_name, file_size, uploaded_at 
             FROM section_documents 
             WHERE user_id = ? AND section_name = ?
             ORDER BY uploaded_at DESC`
        );

        const documents = stmt.all(username, section) as DocumentRow[];

        const formattedDocuments = documents.map(doc => ({
            name: doc.file_name,
            size: `${Math.round(doc.file_size / 1024)} KB`,
            dateModified: new Date(doc.uploaded_at).toLocaleString('ro-RO', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        }));

        return NextResponse.json({ documents: formattedDocuments }, { status: 200 });

    } catch (error) {
        console.error('Eroare la preluarea documentelor:', error);
        return NextResponse.json({ error: 'Eroare internă de server' }, { status: 500 });
    }
}

