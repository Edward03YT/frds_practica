import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import { verifyToken } from '../../lib/auth';
import { cookies } from 'next/headers';

const db = new Database("database.sqlite");

async function getUserFromRequest(req: NextRequest) {
  console.log('🔐 [AUTH] Getting user from request...');
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('authToken')?.value;
    console.log('🔐 [AUTH] Token found:', !!token);

    if (!token) {
      console.log('🔐 [AUTH] No token found');
      return null;
    }

    const user = verifyToken(token);
    console.log('🔐 [AUTH] User verified:', user ? user.username : 'null');
    return user;
  } catch (error) {
    console.error('🔐 [AUTH] Error getting user:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  console.log('🚀 [API] POST /api/paap_totaluri starting...');

  try {
    // 1. Verificare utilizator
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log('❌ [API] User not authenticated');
      return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
    }

    console.log('✅ [API] User authenticated:', user.username);

    // 2. Citire request body
    console.log('📥 [API] Reading request body...');
    const body = await req.json();
    console.log('📥 [API] Request body received:', JSON.stringify(body, null, 2));
    console.log('📥 [API] Body type:', typeof body);
    console.log('📥 [API] Body.totaluri type:', typeof body.totaluri);
    console.log('📥 [API] Body.totaluri is array:', Array.isArray(body.totaluri));

    // 3. Validare date
    if (!Array.isArray(body.totaluri)) {
      console.log('❌ [API] Invalid data - totaluri is not an array');
      console.log('📊 [API] Received totaluri:', body.totaluri);
      return NextResponse.json({ success: false, error: "Date lipsă sau invalide" }, { status: 400 });
    }

    if (body.totaluri.length === 0) {
      console.log('⚠️ [API] Empty totaluri array');
      return NextResponse.json({ success: false, error: "Niciun total de salvat" }, { status: 400 });
    }

    console.log('✅ [API] Data validation passed');
    console.log('📊 [API] Totaluri to process:', body.totaluri.length, 'items');

    // 4. Verificare structura bazei de date
    console.log('🗄️ [DB] Checking database structure...');
    try {
      const tableInfo = db.prepare("PRAGMA table_info(paap_totaluri)").all();
      console.log('🗄️ [DB] Table structure:', tableInfo);
    } catch (dbError) {
      console.error('🗄️ [DB] Error checking table structure:', dbError);
    }

    // 5. Ștergere date vechi
    console.log('🗑️ [DB] Deleting old totaluri for user:', user.username);
    try {
      const deleteStmt = db.prepare("DELETE FROM paap_totaluri WHERE user = ?");
      const deleteResult = deleteStmt.run(user.username);
      console.log('🗑️ [DB] Deleted rows:', deleteResult.changes);
    } catch (deleteError) {
      console.error('🗑️ [DB] Error deleting old data:', deleteError);
      throw deleteError;
    }

    // 6. Inserare date noi
    console.log('💾 [DB] Inserting new totaluri...');
    const insertStmt = db.prepare(`
      INSERT INTO paap_totaluri (user, tip, suma)
      VALUES (?, ?, ?)
    `);

    let insertedCount = 0;
    for (let i = 0; i < body.totaluri.length; i++) {
      const t = body.totaluri[i];
      console.log(`💾 [DB] Inserting item ${i + 1}/${body.totaluri.length}:`);
      console.log(`    user: "${user.username}"`);
      console.log(`    tip: "${t.tip}" (type: ${typeof t.tip})`);
      console.log(`    suma: ${t.suma} (type: ${typeof t.suma})`);

      try {
        const result = insertStmt.run(user.username, t.tip, t.suma);
        console.log(`💾 [DB] Insert result:`, result);
        insertedCount++;
      } catch (insertError) {
        console.error(`💾 [DB] Error inserting item ${i + 1}:`, insertError);
        console.error(`💾 [DB] Failed item data:`, t);
        throw insertError;
      }
    }

    console.log(`✅ [DB] Successfully inserted ${insertedCount}/${body.totaluri.length} totaluri`);

    // 7. Verificare finală
    console.log('🔍 [DB] Verification - checking inserted data...');
    try {
      const verification = db.prepare("SELECT * FROM paap_totaluri WHERE user = ? ORDER BY data_upload DESC").all(user.username);
      console.log('🔍 [DB] Current data in database for user:', verification);

      if (verification.length === 0) {
        console.warn('⚠️ [DB] No data found after insertion!');
      } else {
        console.log('✅ [DB] Verification passed - found', verification.length, 'records');
      }
    } catch (verifyError) {
      console.error('🔍 [DB] Error during verification:', verifyError);
    }

    console.log('🎉 [API] POST request completed successfully');
    return NextResponse.json({ success: true, inserted: insertedCount });

  } catch (error) {
    console.error('💥 [API] Fatal error in POST:', error);
    if (error instanceof Error) {
      console.error('💥 [API] Error stack:', error.stack);
    }
    let errorMessage = 'Eroare necunoscută';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      error: "Eroare server: " + errorMessage
    }, { status: 500 });

  }
}

export async function GET(req: NextRequest) {
  console.log('🚀 [API] GET /api/paap_totaluri starting...');

  try {
    const user = await getUserFromRequest(req);
    if (!user) {
      console.log('❌ [API] User not authenticated for GET');
      return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
    }

    console.log('🔍 [API] Fetching totaluri for user:', user.username);
    const rows = db.prepare("SELECT tip, suma, data_upload FROM paap_totaluri WHERE user = ? ORDER BY data_upload DESC").all(user.username);
    console.log('🔍 [API] Found rows:', rows.length);
    console.log('🔍 [API] Data:', rows);

    return NextResponse.json({ success: true, totaluri: rows });

  } catch (error) {
    console.error('💥 [API] Error in GET:', error);
    let errorMessage = 'Eroare necunoscută';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({
      success: false,
      error: "Eroare server: " + errorMessage
    }, { status: 500 });

  }
}