import db from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../lib/auth';
import { logAudit } from '../../lib/audit';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  let username = '';
  let fileName = '';
  try {
    // 1. Procesare FormData
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch (error) {
      try { logAudit('', 'upload', 'Format invalid de date la upload'); } catch {}
      return NextResponse.json({ error: 'Format invalid de date' }, { status: 400 });
    }

    const file = formData.get('file') as File | null;

    if (!file) {
      try { logAudit('', 'upload', 'Lipsește fișierul la upload'); } catch {}
      return NextResponse.json({ error: 'Lipsește fișierul' }, { status: 400 });
    }

    fileName = file.name;

    // Validare tip și dimensiune fișier
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      try { logAudit('', 'upload', `Tip de fișier neacceptat: ${file.name}`); } catch {}
      return NextResponse.json(
        { error: 'Tip de fișier neacceptat. Folosește Excel (.xlsx, .xls) sau CSV.' },
        { status: 400 }
      );
    }
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      try { logAudit('', 'upload', `Fișier prea mare: ${file.name}`); } catch {}
      return NextResponse.json(
        { error: 'Fișierul este prea mare. Dimensiunea maximă este 10MB.' },
        { status: 400 }
      );
    }

    // 2. Extrage tokenul din cookie
    let token: string | undefined = undefined;
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/authToken=([^;]+)/);
      if (match) {
        try {
          token = decodeURIComponent(match[1]);
        } catch (error) {
          try { logAudit('', 'upload', 'Token invalid la upload'); } catch {}
          return NextResponse.json({ error: 'Token invalid' }, { status: 401 });
        }
      }
    }
    if (!token) {
      try { logAudit('', 'upload', 'Neautentificat - token lipsă la upload'); } catch {}
      return NextResponse.json({ error: 'Neautentificat - token lipsă' }, { status: 401 });
    }

    // 3. Verificare user
    let user;
    try {
      user = verifyToken(token);
      username = user?.username || '';
    } catch (error) {
      try { logAudit('', 'upload', 'Token invalid sau expirat la upload'); } catch {}
      return NextResponse.json({ error: 'Token invalid sau expirat' }, { status: 401 });
    }
    if (!user || !user.username) {
      try { logAudit('', 'upload', 'Utilizator invalid la upload'); } catch {}
      return NextResponse.json({ error: 'Utilizator invalid' }, { status: 401 });
    }

    // 4. Citește fișierul ca buffer
    let buffer: Buffer;
    try {
      const arrayBuffer = await file.arrayBuffer();
      buffer = Buffer.from(arrayBuffer);
      if (buffer.length === 0) {
        try { logAudit(username, 'upload', `Fișierul este gol: ${file.name}`); } catch {}
        return NextResponse.json({ error: 'Fișierul este gol' }, { status: 400 });
      }
    } catch (error) {
      try { logAudit(username, 'upload', `Eroare la citirea fișierului: ${file.name}`); } catch {}
      return NextResponse.json({ error: 'Eroare la citirea fișierului' }, { status: 500 });
    }

    // 5. Salvează în baza de date (insert sau update)
    let result;
    let fileAction = '';
    try {
      const transaction = db.transaction(() => {
        // Verifică dacă există deja un fișier cu același nume pentru user
        const existing = db.prepare(
          'SELECT id FROM files WHERE user_id = ? AND file_name = ?'
        ).get(username, file.name) as { id: number } | undefined;

        const timestamp = new Date().toISOString();

        if (existing) {
          // UPDATE
          const updateResult = db.prepare(
            'UPDATE files SET file_content = ?, uploaded_at = ? WHERE id = ?'
          ).run(buffer, timestamp, existing.id);

          if (updateResult.changes === 0) {
            fileAction = 'eșec actualizare';
            throw new Error('Nu s-a putut actualiza fișierul');
          }

          fileAction = 'actualizat';
          return { success: true, updated: true, id: existing.id };
        } else {
          // INSERT
          const insertResult = db.prepare(
            'INSERT INTO files (file_name, file_content, user_id, uploaded_at) VALUES (?, ?, ?, ?)'
          ).run(file.name, buffer, username, timestamp);

          if (insertResult.changes === 0) {
            fileAction = 'eșec inserare';
            throw new Error('Nu s-a putut insera fișierul');
          }

          fileAction = 'încărcat';
          const insertedId = insertResult.lastInsertRowid as number;
          return { success: true, inserted: true, id: insertedId };
        }
      });

      result = transaction();

    } catch (dbError) {
      try { logAudit(username, 'upload', `Eroare la salvarea în baza de date: ${fileName}`); } catch {}
      return NextResponse.json(
        { error: 'Eroare la salvarea în baza de date' },
        { status: 500 }
      );
    }

    // *** Audit DUPĂ tranzacție ***
    try {
      if (fileAction === 'actualizat') {
        logAudit(username, 'upload', `Fișier actualizat cu succes: ${fileName}`);
      } else if (fileAction === 'încărcat') {
        logAudit(username, 'upload', `Fișier încărcat cu succes: ${fileName}`);
      }
    } catch (e) {
      console.error('Eroare la logAudit:', e);
    }

    return NextResponse.json(result);

  } catch (error) {
    try { logAudit(username, 'upload', 'Eroare internă de server la upload'); } catch {}
    return NextResponse.json(
      { error: 'Eroare internă de server' },
      { status: 500 }
    );
  }
}