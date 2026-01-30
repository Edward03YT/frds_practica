import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcrypt';
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '../../lib/auth';

const dbPath = path.join(process.cwd(), 'database.sqlite');

export async function GET(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const userFromToken = verifyToken(token);
  if (!userFromToken) {
    return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
  }

  const db = new Database(dbPath);
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
    cod_proiect?: string;
    telefon?: string;
    judet?: string;
    localitate?: string;
  };

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(userFromToken.username) as DBUser | undefined;

  if (!user || (!user.is_admin && !user.is_moderator)) {
    db.close();
    return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
  }
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '10', 10);
  const search = searchParams.get('search') || '';
  const filter = searchParams.get('filter') || 'all';
  const codProiect = searchParams.get('cod_proiect') || '';
  const offset = (page - 1) * limit;

  try {
    let baseQuery = `FROM users WHERE 1=1`;
    const params: any[] = [];

    if (search) {
      baseQuery += ` AND (username LIKE ? OR name LIKE ? OR email LIKE ?)`;
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
    }
    if (filter === 'admin') {
      baseQuery += ` AND is_admin = 1`;
    } else if (filter === 'moderator') {
      baseQuery += ` AND is_moderator = 1 AND is_admin = 0`;
    } else if (filter === 'user') {
      baseQuery += ` AND is_admin = 0 AND is_moderator = 0`;
    }
    if (codProiect) {
      baseQuery += ` AND cod_proiect LIKE ?`;
      params.push(`%${codProiect}%`);
    }

    const countQuery = `SELECT COUNT(*) as count ${baseQuery}`;
    const totalUsersRow = db.prepare(countQuery).get(...params) as { count: number };
    const totalUsers = totalUsersRow.count;

    const usersQuery = `
     SELECT id, username, name, email, is_admin, is_moderator, created_at, updated_at, last_ip, cod_proiect, telefon, judet, localitate
      ${baseQuery}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `;
    params.push(limit, offset);

    const users = db.prepare(usersQuery).all(...params) as Array<any>;

    // Adaugă fișierele și numărul de fișiere pentru fiecare user
    const usersWithFiles = users.map(user => {
      const uploads = db.prepare(`
        SELECT id, file_name, page, uploaded_at
        FROM uploads 
        WHERE user = ? 
        ORDER BY uploaded_at DESC
      `).all(user.username) as Array<{
        id: number;
        file_name: string;
        page: string;
        uploaded_at: string;
      }>;

      return {
        ...user,
        uploaded_files: uploads,
        files_count: uploads.length
      };
    });

    // Statistici totale
    const totalAllUsersRow = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalAllUsers = totalAllUsersRow.count;
    const totalAdminsRow = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get() as { count: number };
    const totalAdmins = totalAdminsRow.count;
    const totalFilesRow = db.prepare('SELECT COUNT(*) as count FROM uploads').get() as { count: number };
    const totalFiles = totalFilesRow.count;
    const totalPages = Math.ceil(totalUsers / limit);

    const pagination = {
      page,
      limit,
      total: totalUsers,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };

    return NextResponse.json({
      success: true,
      data: {
        users: usersWithFiles,
        pagination,
        stats: {
          totalUsers: totalAllUsers,
          totalAdmins,
          totalFiles,
          filteredTotal: totalUsers
        }
      }
    });
  } catch (error) {
    console.error('Eroare la obținerea utilizatorilor:', error);
    return NextResponse.json({
      success: false,
      error: 'Eroare la obținerea utilizatorilor'
    }, { status: 500 });
  } finally {
    db.close();
  }
}

// --- POST: Creare user nou (admin/moderator) ---

export async function POST(request: NextRequest) {
  const token = request.cookies.get('authToken')?.value;
  const userFromToken = verifyToken(token);
  if (!userFromToken) {
    return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
  }

  const db = new Database(dbPath);
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(userFromToken.username) as { is_admin: number, is_moderator: number } | undefined;

  if (!user || (!user.is_admin && !user.is_moderator)) {
    db.close();
    return NextResponse.json({ success: false, error: 'Nu ai voie!' }, { status: 403 });
  }

  try {
    const {
      username,
      name,
      email,
      password,
      is_admin,
      is_moderator,
      cod_proiect,
      localitate,
      judet,
      telefon
    } = await request.json();

    // Validare simplă
    if (
      !username || !name || !email || !password ||
      !cod_proiect || !localitate || !judet || !telefon
    ) {
      db.close();
      return NextResponse.json({ success: false, error: 'Toate câmpurile sunt obligatorii!' }, { status: 400 });
    }

    // Verifică dacă userul există deja
    const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email);
    if (exists) {
      db.close();
      return NextResponse.json({ success: false, error: 'Username sau email deja folosit!' }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    db.prepare(`
      INSERT INTO users (username, name, email, password, is_admin, is_moderator, cod_proiect, localitate, judet, telefon, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      username,
      name,
      email,
      hashedPassword,
      is_admin ? 1 : 0,
      is_moderator ? 1 : 0,
      cod_proiect,
      localitate,
      judet,
      telefon
    );

    db.close();
    return NextResponse.json({ success: true, message: 'Utilizator creat cu succes!' });
  } catch (error) {
    db.close();
    console.error('Eroare la crearea utilizatorului:', error);
    return NextResponse.json({ success: false, error: 'Eroare la crearea utilizatorului' }, { status: 500 });
  }
}