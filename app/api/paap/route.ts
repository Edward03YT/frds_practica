import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { verifyToken } from '../../lib/auth';
import { cookies } from 'next/headers';

const dbPath = path.join(process.cwd(), "database.sqlite");
console.log("DB PATH:", dbPath);
const db = new Database(dbPath);

type PaapFile = {
  id: number;
  user: string;
  name: string;
  version: number;
  created_at: string;
  updated_at: string;
  NR_Inregistari: number;
  file_content?: Buffer;
};

// --- Helper pentru user din token ---
async function getUserFromRequest(req: NextRequest) {
  const cookieStore = await cookies();
  let token = cookieStore.get('authToken')?.value;

  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  if (!token) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/authToken=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }
  }
  const { searchParams } = new URL(req.url);
  if (!token) {
    token = searchParams.get('token') ?? undefined;
  }
  if (!token) return null;
  const user = verifyToken(token);
  return user;
}

// GET: Listare fișiere PAAP sau download dacă există ?download=nume_fisier
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Download Excel dacă există ?download=nume_fisier
  const downloadName = searchParams.get("download");
  if (downloadName) {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
    }
    // Ia cel mai nou fișier cu acest nume pentru userul curent
    const file = db.prepare(
      "SELECT file_content FROM paap_files WHERE name=? AND user=? ORDER BY updated_at DESC LIMIT 1"
    ).get(downloadName, user.username) as { file_content?: Buffer };
    if (!file?.file_content) {
      return NextResponse.json({ error: "Fișierul nu există" }, { status: 404 });
    }
    return new NextResponse(new Uint8Array(file.file_content), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${downloadName}"`
      }
    });
  }

  // --- AICI: userul din token ---
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Neautentificat" }, { status: 401 });
  }

  // --- FILTRARE DOAR PE USERUL LOGAT ---
  const files = db.prepare(
    "SELECT id, user, name, version, created_at, updated_at, NR_Inregistari FROM paap_files WHERE user = ? ORDER BY updated_at DESC"
  ).all(user.username);
  return NextResponse.json(files);
}

// POST: Upload PAAP nou (fișier Excel + name) - dacă există deja, face UPDATE
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
  }

  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const nrInreg = formData.get("NR_Inregistari") as string | null;
    const NR_Inregistari = nrInreg ? parseInt(nrInreg) : 0;

    if (!file || !name) {
      return NextResponse.json({ success: false, error: "Lipsesc datele" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Dacă există deja fișier cu același nume și user, UPDATE, altfel INSERT
    const existing = db.prepare(
      "SELECT id FROM paap_files WHERE name=? AND user=?"
    ).get(name, user.username) as { id: number } | undefined;

    if (existing) {
      db.prepare(`
        UPDATE paap_files
        SET file_content=?, NR_Inregistari=?, updated_at=CURRENT_TIMESTAMP, version=version+1
        WHERE id=? AND user=?
      `).run(buffer, NR_Inregistari, existing.id, user.username);
    } else {
      db.prepare(`
        INSERT INTO paap_files (user, name, file_content, NR_Inregistari)
        VALUES (?, ?, ?, ?)
      `).run(user.username, name, buffer, NR_Inregistari);
    }

    // --- INSERARE ÎN uploads ---
    try {
      db.prepare(`
        INSERT INTO uploads (user, file_name, page)
        VALUES (?, ?, ?)
      `).run(user.username, name, "paap");
      console.log("UPLOADS INSERTED:", user.username, name, "paap");
    } catch (err) {
      console.error("Eroare la inserare uploads:", err);
    }

    return NextResponse.json({ success: true });
  }

  // fallback pentru json
  const { name, NR_Inregistari } = await req.json();
  db.prepare(`
    INSERT INTO paap_files (user, name, NR_Inregistari)
    VALUES (?, ?, ?)
  `).run(user.username, name, NR_Inregistari || 0);

  // --- INSERARE ÎN uploads ---
  try {
    db.prepare(`
      INSERT INTO uploads (user, file_name, page)
      VALUES (?, ?, ?)
    `).run(user.username, name, "paap");
    console.log("UPLOADS INSERTED:", user.username, name, "paap");
  } catch (err) {
    console.error("Eroare la inserare uploads:", err);
  }

  return NextResponse.json({ success: true });
}

// PUT: Reupload PAAP (crește versiunea automat prin trigger)
export async function PUT(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
  }

  if (req.headers.get("content-type")?.includes("multipart/form-data")) {
    const formData = await req.formData();
    const id = formData.get("id");
    const name = formData.get("name");
    const file = formData.get("file") as File;
    const nrInreg = formData.get("NR_Inregistari");

    if (!id || !name || !file) {
      return NextResponse.json({ success: false, error: "id, name și file sunt obligatorii" }, { status: 400 });
    }

    // Verifică dacă fișierul aparține userului logat!
    const old = db.prepare("SELECT * FROM paap_files WHERE id=? AND user=?").get(id, user.username) as PaapFile | undefined;
    if (!old) {
      return NextResponse.json({ success: false, error: "Nu ai dreptul să modifici acest fișier" }, { status: 403 });
    }

    // Backup vechiul fișier
    db.prepare(`
      INSERT INTO paap_files_backup (paap_file_id, name, file_content, NR_Inregistari, version)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, old.name, old.file_content, old.NR_Inregistari, old.version);

    const buffer = Buffer.from(await file.arrayBuffer());
    db.prepare(`
      UPDATE paap_files
      SET name=?, file_content=?, NR_Inregistari=?, updated_at=CURRENT_TIMESTAMP, version=version+1
      WHERE id=? AND user=?
    `).run(name, buffer, nrInreg ? parseInt(nrInreg as string) : 0, id, user.username);

    // --- INSERARE ÎN uploads ---
    try {
      db.prepare(`
        INSERT INTO uploads (user, file_name, page)
        VALUES (?, ?, ?)
      `).run(user.username, name, "paap");
      console.log("UPLOADS INSERTED:", user.username, name, "paap");
    } catch (err) {
      console.error("Eroare la inserare uploads:", err);
    }

    return NextResponse.json({ success: true });
  }

  // fallback pentru JSON (nu recomandat pentru update cu fișier)
  return NextResponse.json({ success: false, error: "Trebuie să trimiți FormData cu fișierul!" }, { status: 400 });
}

// DELETE: Ștergere PAAP (șterge doar dacă aparține userului logat)
export async function DELETE(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ success: false, error: "id este obligatoriu" }, { status: 400 });
    }
    // Șterge doar dacă fișierul aparține userului logat!
    const info = db.prepare("DELETE FROM paap_files WHERE id=? AND user=?").run(id, user.username);
    if (info.changes === 0) {
      return NextResponse.json({ success: false, error: "Nu s-a găsit fișierul sau nu ai dreptul să-l ștergi" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    let errorMessage = "Internal server error";
    if (err instanceof Error) {
      errorMessage = err.message;
    }
    return NextResponse.json({
      success: false,
      error: errorMessage
    }, { status: 500 });
  }
}