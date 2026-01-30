import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import path from "path";
import { verifyToken } from '../../lib/auth'; // ajustează calea dacă e nevoie

const dbPath = path.join(process.cwd(), "database.sqlite");

// ===================== POST =====================
// Doar admin poate trimite anunțuri individuale
export async function POST(request: NextRequest) {
    const token = request.cookies.get('authToken')?.value;
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Nu ai voie!" }, { status: 403 });
    }

    const { userId, subject, message } = await request.json();
    if (!userId || !subject || !message) {
        return NextResponse.json({ success: false, error: "Toate câmpurile sunt obligatorii" }, { status: 400 });
    }
    const db = new Database(dbPath);
    try {
        db.prepare(
            "INSERT INTO user_announcements (user_id, subject, message) VALUES (?, ?, ?)"
        ).run(userId, subject, message);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: "Eroare la salvare" }, { status: 500 });
    } finally {
        db.close();
    }
}

// ===================== GET =====================
// Userul logat poate vedea DOAR anunțurile lui, adminul poate vedea orice
export async function GET(request: NextRequest) {
    const token = request.cookies.get('authToken')?.value;
    const user = verifyToken(token);
    if (!user) {
        return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
        return NextResponse.json({ success: false, error: "userId lipsă" }, { status: 400 });
    }

    // Doar userul logat sau adminul poate vedea anunțurile
    if (user.role !== "admin" && String(user.id) !== String(userId)) {
        return NextResponse.json({ success: false, error: "Nu ai voie!" }, { status: 403 });
    }

    const db = new Database(dbPath);
    try {
        const rows = db.prepare(
            "SELECT id, subject, message, created_at FROM user_announcements WHERE user_id = ? ORDER BY created_at DESC"
        ).all(userId);
        return NextResponse.json({ success: true, announcements: rows });
    } catch (e) {
        return NextResponse.json({ success: false, error: "Eroare la citire" }, { status: 500 });
    } finally {
        db.close();
    }
}

// ===================== DELETE =====================
// Doar admin poate șterge anunțuri individuale
export async function DELETE(request: NextRequest) {
    const token = request.cookies.get('authToken')?.value;
    const user = verifyToken(token);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ success: false, error: "Nu ai voie!" }, { status: 403 });
    }

    const { id } = await request.json();
    if (!id) {
        return NextResponse.json({ success: false, error: "ID lipsă" }, { status: 400 });
    }
    const db = new Database(dbPath);
    try {
        db.prepare("DELETE FROM user_announcements WHERE id = ?").run(id);
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ success: false, error: "Eroare la ștergere" }, { status: 500 });
    } finally {
        db.close();
    }
}