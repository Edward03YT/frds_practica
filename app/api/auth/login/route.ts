import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/app/db";
import bcrypt from "bcrypt";
import { signToken } from '../../../lib/auth';

interface LoginRequest {
  username: string;
  password: string;
}

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  is_admin: number;
  password?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: "Username și parola sunt obligatorii" },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT id, username, name, email, password, is_admin
      FROM users
      WHERE username = ? OR email = ?
    `).get(username, username) as User | undefined;

    if (!user || !user.password) {
      return NextResponse.json(
        { success: false, error: "Date de autentificare invalide" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        { success: false, error: "Date de autentificare invalide" },
        { status: 401 }
      );
    }

    let ip = request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";

    if (ip === "::1" || ip === "::ffff:127.0.0.1") {
      ip = "127.0.0.1";
    }

    db.prepare(`UPDATE users SET last_ip = ? WHERE id = ?`).run(ip, user.id);

    const responseUser = {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.is_admin === 1 ? "admin" : "user",
    };

    const token = signToken(responseUser);

    const response = NextResponse.json({
      success: true,
      message: "Autentificare reușită",
      user: responseUser,
      token,
    });

    // Detectează contextul de rulare
    const host = request.headers.get('host') || '';
    const userAgent = request.headers.get('user-agent') || '';
    const isLocalhost = host.includes('localhost') || host.includes('127.0.0.1');
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent);

    console.log('Login context:', { host, isMobile, isLocalhost });

    // Setări cookie adaptate pentru mobile
    const cookieOptions = {
      httpOnly: true,
      secure: true, 
      sameSite: "lax" as const,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 zile
     
      ...(isMobile ? {} : {})
    };

    console.log('Cookie options:', cookieOptions);

    response.cookies.set("authToken", token, cookieOptions);

    // BACKUP: Setează și prin header manual pentru mobile
    if (isMobile) {
      const cookieString = `authToken=${token}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      response.headers.set('Set-Cookie', cookieString);
    }

    return response;

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Eroare internă de server" },
      { status: 500 }
    );
  }
}