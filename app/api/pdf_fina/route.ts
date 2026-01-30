import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '../../lib/auth';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'database.sqlite');
const db = new Database(dbPath);

function isSignedPDF(buffer: Buffer): boolean {
    // Caută semnătura digitală în conținutul PDF-ului
    const content = buffer.toString('latin1');
    return (
        content.includes('/Type /Sig') ||
        content.includes('/Adobe.PPKLite') ||
        content.includes('/Contents')
    );
}

export async function POST(request: NextRequest) {
    const cookieStore = await cookies();
    let token = cookieStore.get('authToken')?.value;

    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

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

    const username = userFromToken.username;
    if (!username) {
        return NextResponse.json({ error: 'Token fără username' }, { status: 401 });
    }

    try {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const selectedFolder = formData.get('selectedFolder') as string | null;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'Niciun fișier selectat.' }, { status: 400 });
        }
        if (!selectedFolder) {
            return NextResponse.json({ error: 'Nicio secțiune (folder) selectată.' }, { status: 400 });
        }

        const stmt = db.prepare(
            `INSERT INTO section_documents (user_id, section_name, file_name, file_size, file_content) 
             VALUES (?, ?, ?, ?, ?)`
        );

        const uploadedFilesInfo: { name: string; size: string; dateModified: string }[] = [];

        for (const file of files) {
            // 1. Verifică extensia și tipul
            if (
                file.type !== 'application/pdf' &&
                !file.name.toLowerCase().endsWith('.pdf')
            ) {
                return NextResponse.json({ error: `Fișierul ${file.name} nu este PDF.` }, { status: 400 });
            }

            // 2. Verifică dacă e semnat electronic
            const fileBuffer = Buffer.from(await file.arrayBuffer());
            if (!isSignedPDF(fileBuffer)) {
                return NextResponse.json({ error: `Fișierul ${file.name} nu este semnat electronic.` }, { status: 400 });
            }

            // 3. Salvează în DB
            const info = stmt.run(
                username,
                selectedFolder,
                file.name,
                file.size,
                fileBuffer
            );

            if (info.changes > 0) {
                uploadedFilesInfo.push({
                    name: file.name,
                    size: `${Math.round(file.size / 1024)} KB`,
                    dateModified: new Date().toLocaleString('ro-RO'),
                });
            }
        }

        return NextResponse.json({
            message: 'Fișiere încărcate cu succes!',
            uploadedFiles: uploadedFilesInfo,
        }, { status: 201 });

    } catch (error: any) {
        console.error('Eroare la upload PDF:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            return NextResponse.json({ error: 'Un fișier cu acest nume există deja în acest folder.' }, { status: 409 });
        }
        return NextResponse.json({ error: 'A apărut o eroare pe server.' }, { status: 500 });
    }
}


export async function DELETE(request: NextRequest) {
    const cookieStore = await cookies();
    let token = cookieStore.get('authToken')?.value;

    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

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

    const username = userFromToken.username;
    if (!username) {
        return NextResponse.json({ error: 'Token fără username' }, { status: 401 });
    }

    try {
        // Poți trimite numele fișierului și folderul în body (JSON sau formData)
        let fileName = '';
        let sectionName = '';

        // Încearcă să citești ca JSON
        try {
            const body = await request.json();
            fileName = body.fileName;
            sectionName = body.sectionName;
        } catch {
            // Dacă nu e JSON, încearcă ca formData
            const formData = await request.formData();
            fileName = formData.get('fileName') as string;
            sectionName = formData.get('sectionName') as string;
        }

        if (!fileName || !sectionName) {
            return NextResponse.json({ error: 'Lipsește numele fișierului sau folderul.' }, { status: 400 });
        }

        const stmt = db.prepare(
            `DELETE FROM section_documents WHERE user_id = ? AND section_name = ? AND file_name = ?`
        );
        const info = stmt.run(username, sectionName, fileName);

        if (info.changes === 0) {
            return NextResponse.json({ error: 'Fișierul nu a fost găsit sau nu ai dreptul să-l ștergi.' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Fișier șters cu succes!' }, { status: 200 });

    } catch (error: any) {
        console.error('Eroare la ștergere PDF:', error);
        return NextResponse.json({ error: 'A apărut o eroare la ștergere.' }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const cookieStore = await cookies();
    let token = cookieStore.get('authToken')?.value;

    if (!token) {
        const authHeader = request.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        }
    }

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

    const username = userFromToken.username;
    if (!username) {
        return NextResponse.json({ error: 'Token fără username' }, { status: 401 });
    }

    // Ia parametrii din query
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const sectionName = searchParams.get('sectionName');

    if (!fileName || !sectionName) {
        return NextResponse.json({ error: 'Lipsește numele fișierului sau folderul.' }, { status: 400 });
    }

    try {
        const stmt = db.prepare(
            `SELECT file_content, file_name FROM section_documents WHERE user_id = ? AND section_name = ? AND file_name = ?`
        );
        const file = stmt.get(username, sectionName, fileName) as { file_content: Buffer, file_name: string } | undefined;

        if (!file) {
            return NextResponse.json({ error: 'Fișierul nu a fost găsit.' }, { status: 404 });
        }

        // Transformă Buffer în Uint8Array pentru NextResponse
        return new NextResponse(new Uint8Array(file.file_content), {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${encodeURIComponent(file.file_name)}"`
            }
        });
    } catch (error) {
        console.error('Eroare la download PDF:', error);
        return NextResponse.json({ error: 'A apărut o eroare la download.' }, { status: 500 });
    }
}