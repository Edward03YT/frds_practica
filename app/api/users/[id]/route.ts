import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { verifyToken } from '../../../lib/auth';

const dbPath = path.join(process.cwd(), "database.sqlite");

type DBUser = {
  id: number;
  username: string;
  name: string;
  email: string;
  is_admin: number;
  is_moderator: number;
  created_at: string;
  updated_at: string;
  last_ip?: string;
  password: string;
  cod_proiect: string;
  telefon: string;
  judet: string;
  localitate: string;
};

interface Upload {
  id: number;
  file_name: string;
  page: string;
  uploaded_at: string;
}

interface UploadStats {
  total_files: number;
  pages_used: number;
  first_upload: string | null;
  last_upload: string | null;
}

export async function GET(
  req: NextRequest,
  context: any
) {
  try {
    const token = req.cookies.get('authToken')?.value;
    const params = await context.params;
    const userId = parseInt(params.id);

    const authUser = verifyToken(token);

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
    }

    const db = new Database(dbPath, { readonly: true });
    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id) as DBUser | undefined;

    if (
      !dbUser ||
      (!dbUser.is_admin && !dbUser.is_moderator && dbUser.id !== userId)
    ) {
      db.close();
      return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
    }

    if (isNaN(userId) || userId <= 0) {
      db.close();
      return NextResponse.json({ success: false, error: "ID invalid" }, { status: 400 });
    }

    // Ia userul după id (pe care vrei să-l vezi)
    const user = db
      .prepare(
        `
      SELECT 
        id, username, name, email, is_admin, is_moderator, created_at, updated_at, last_ip, password,
        cod_proiect, telefon, judet, localitate
      FROM users 
      WHERE id = ?
    `
      )
      .get(userId) as DBUser | undefined;

    if (!user) {
      db.close();
      return NextResponse.json({ success: false, error: "Utilizatorul nu există" }, { status: 404 });
    }

    // Ia fișierele după username (coloana "user" din uploads)
    const uploads = db
      .prepare(
        `
  SELECT id, file_name, page, uploaded_at
  FROM uploads 
  WHERE user = ? 
  ORDER BY uploaded_at DESC
`
      )
      .all(user.username) as Upload[];
    console.log("uploads din DB:", uploads);

    const uploadStats = db
      .prepare(
        `
  SELECT 
    COUNT(*) as total_files,
    COUNT(DISTINCT page) as pages_used,
    MIN(uploaded_at) as first_upload,
    MAX(uploaded_at) as last_upload
  FROM uploads 
  WHERE user = ?
`
      )
      .get(user.username) as UploadStats;

    db.close();

    // Grupuim fișierele pe pagini (page)
    const filesByPage = uploads.reduce<Record<string, Upload[]>>((acc, upload) => {
      const pageKey = String(upload.page);
      if (!acc[pageKey]) acc[pageKey] = [];
      acc[pageKey].push(upload);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      data: {
        user,
        uploads,
        uploadStats,
        filesByPage,
      },
    });
  } catch (error) {
    console.error("Eroare la obținerea detaliilor utilizatorului:", error);
    return NextResponse.json({ success: false, error: "Eroare server" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const token = request.cookies.get('authToken')?.value;
    const params = await context.params;
    const userId = parseInt(params.id);

    const authUser = verifyToken(token);

    if (!authUser) {
      return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
    }

    const db = new Database(dbPath);
    const dbUser = db.prepare('SELECT * FROM users WHERE id = ?').get(authUser.id) as DBUser | undefined;

    if (
      !dbUser ||
      (!dbUser.is_admin && dbUser.id !== userId)
    ) {
      db.close();
      return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);

    // Ia username-ul userului
    const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string } | undefined;
    if (!user) {
      db.close();
      return NextResponse.json({ success: false, error: "Utilizatorul nu există" }, { status: 404 });
    }

    const uploadId = searchParams.get("uploadId");

    if (uploadId) {
      const result = db
        .prepare(`DELETE FROM uploads WHERE id = ? AND user = ?`)
        .run(parseInt(uploadId), user.username);
      db.close();

      if (result.changes === 0) {
        return NextResponse.json(
          { success: false, error: "Fișierul nu a fost găsit" },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Fișierul a fost șters",
      });
    } else {
      // Ștergem toate fișierele utilizatorului și apoi utilizatorul (dacă dorești)
      db.prepare("DELETE FROM uploads WHERE user = ?").run(user.username);
      db.prepare("DELETE FROM users WHERE id = ?").run(userId);

      db.close();

      return NextResponse.json({
        success: true,
        message: "Utilizatorul și toate fișierele asociate au fost șterse",
      });
    }
  } catch (error) {
    console.error("Eroare la ștergerea fișierelor:", error);
    return NextResponse.json(
      { success: false, error: "Eroare la ștergerea fișierelor" },
      { status: 500 }
    );
  }
}