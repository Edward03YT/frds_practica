import db from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
        return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Ia doar fișierele cu "ach" în nume (case-insensitive)
    const file = db.prepare(
        `SELECT file_content, file_name 
         FROM files 
         WHERE user_id = ? AND LOWER(file_name) LIKE '%ach%' 
         ORDER BY uploaded_at DESC LIMIT 1`
    ).get(userId) as { file_content: Buffer, file_name: string } | undefined;

    if (!file) {
        return NextResponse.json({ rows: 0, fileName: null });
    }

    try {
        const workbook = XLSX.read(file.file_content, { type: 'buffer' });
        const firstSheet = workbook.SheetNames[0];
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet], { header: 1, defval: null, raw: false });

        // Elimină primele 6 rânduri (dacă așa vrei tu)
        const dataRows = data.slice(6);

        // Numără doar rândurile care au cel puțin o celulă completată
        const nonEmptyRows = dataRows.filter(row =>
            Array.isArray(row) &&
            row.some(cell => {
                if (cell === null || cell === undefined) return false;
                if (typeof cell === "string" && cell.trim() === "") return false;
                return true;
            })
        );

        const rows = nonEmptyRows.length;

        // Returnează și numele fișierului (opțional)
        return NextResponse.json({ rows, fileName: file.file_name });
    } catch (e) {
        return NextResponse.json({ rows: 0, fileName: file.file_name, error: 'Parse error' });
    }
}