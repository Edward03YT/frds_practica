import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function openDb() {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
}

function validateHeaderRow(headerRow: any[]): string | null {
  if (!headerRow || headerRow.length < 8) {
    return 'Linia 2 din worksheet 2 nu are 8 coloane';
  }
  return null;
}

function validateDetaliatRow(row: any[], rowIndex: number): string | null {
  const stringValue = (i: number) => row[i] == null ? '' : String(row[i]).trim();
  if (!stringValue(0)) return `Rândul ${rowIndex + 3}, coloana 1: NR_CRT este gol!`;
  if (stringValue(1) && !/^(AC|CS|C|F|BF|CM)\d+$/i.test(stringValue(1))) return 'Trebuie să înceapă cu "AC", "CS","F , "BF", " CM "sau "C" urmat de cifre (ex: C123, AC456, CS789)';
  if (stringValue(2) && !/^[A-Za-z]{3}\d{2}-[A-Za-z]\d{2}$/.test(stringValue(2))) {return `Rândul ${rowIndex + 3}, coloana 3: Format invalid (ex: PAP01-L01, XYZ99-A01)`;}
  if (stringValue(3) && !/^P(P|\d+)?$/i.test(stringValue(3))) return `Rândul ${rowIndex + 3}, coloana 4: Trebuie să înceapă cu P și să urmeze fie un P, fie cifre (ex: P, PP, P1, P23)`;
  if (stringValue(4) && !['B', 'S', 'L'].includes(stringValue(4).toUpperCase())) return `Rândul ${rowIndex + 3}, coloana 5: Doar literele B, S, L sunt permise`;
  if (stringValue(6) && !/^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(stringValue(6))) return `Rândul ${rowIndex + 3}, coloana 7: Trebuie să fie un număr cu maxim 2 zecimale`;
  if (stringValue(9) && !/^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/.test(stringValue(9))) return `Rândul ${rowIndex + 3}, coloana 10: Trebuie să fie un număr cu maxim 2 zecimale`;
  if (stringValue(10) && !/^\d{1,6}$/.test(stringValue(10))) return `Rândul ${rowIndex + 3}, coloana 11: Trebuie să fie un număr cu maxim 6 cifre`;
  if (stringValue(11) && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(stringValue(11))) return `Rândul ${rowIndex + 3}, coloana 12: Data trebuie să fie în formatul DD/MM/YYYY.`;
  if (stringValue(12) && !/^(RO)?\d{1,10}$/i.test(stringValue(12))) return `Rândul ${rowIndex + 3}, coloana 13: CUI trebuie să conțină doar cifre, opțional prefixat cu "RO".`;
  if (stringValue(14) && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(stringValue(14))) return `Rândul ${rowIndex + 3}, coloana 15: Data trebuie să fie în formatul DD/MM/YYYY.`;
  return null;
}

export async function POST(req: NextRequest) {
  let db: any = null;
  let insertStmt: any = null;
  try {
    const body = await req.json();
    const { user, fileName, sheetNames, sheetsData } = body;

    if (!user) return NextResponse.json({ error: 'Lipsește user!' }, { status: 400 });
    if (!sheetNames || !sheetsData || sheetNames.length < 2) return NextResponse.json({ error: 'Fișierul trebuie să aibă cel puțin 2 sheet-uri' }, { status: 400 });

    const raportRows = sheetsData[sheetNames[1]] || [];
    if (raportRows.length < 2) return NextResponse.json({ error: 'Worksheet 2 nu are suficiente rânduri', raportRows }, { status: 400 });
    const headerRow = raportRows[1];

    const headerError = validateHeaderRow(headerRow);
    if (headerError) return NextResponse.json({ error: headerError, headerRow }, { status: 400 });

    db = await openDb();

    // Caută dacă există deja raport
    const existingRaport = await db.get(
      `SELECT ID FROM RAPORT_ACHIZITII WHERE COD_PROIECT = ? AND NR_RAPORT = ?`,
      [headerRow[0], headerRow[1]]
    );

    let idRaport: number;

    if (existingRaport && existingRaport.ID) {
      // UPDATE la RAPORT_ACHIZITII (NU modifici ID!)
      await db.run(
        `UPDATE RAPORT_ACHIZITII SET
          DATA_INCEPUT = ?, DATA_FINAL = ?, PRIMAR = ?, COODONATOR_PROIECT = ?,
          EXPERT_ACHIZITII_PUBLICE = ?, NR_INREGISTRARI = ?
         WHERE ID = ?`,
        [
          headerRow[2], // DATA_INCEPUT
          headerRow[3], // DATA_FINAL
          headerRow[4], // PRIMAR
          headerRow[5], // COODONATOR_PROIECT
          headerRow[6], // EXPERT_ACHIZITII_PUBLICE
          headerRow[7], // NR_INREGISTRARI
          existingRaport.ID
        ]
      );
      // Șterge detaliile vechi pentru acest raport
      await db.run(
        `DELETE FROM RAPORT_ACHIZITII_DETALIAT WHERE ID_RAPORT = ?`,
        [existingRaport.ID]
      );
      idRaport = existingRaport.ID;
    } else {
      // INSERT nou
      const result = await db.run(
        `INSERT INTO RAPORT_ACHIZITII (
          COD_PROIECT, NR_RAPORT, DATA_INCEPUT, DATA_FINAL, PRIMAR, COODONATOR_PROIECT, 
          EXPERT_ACHIZITII_PUBLICE, NR_INREGISTRARI
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          headerRow[0], // COD_PROIECT
          headerRow[1], // NR_RAPORT
          headerRow[2], // DATA_INCEPUT
          headerRow[3], // DATA_FINAL
          headerRow[4], // PRIMAR
          headerRow[5], // COODONATOR_PROIECT
          headerRow[6], // EXPERT_ACHIZITII_PUBLICE
          headerRow[7], // NR_INREGISTRARI
        ]
      );
      idRaport = result.lastID;
    }

    // Detaliat
    const detaliatRows = (sheetsData[sheetNames[0]] || [])
      .slice(2)
      .filter((row: any[]) =>
        Array.isArray(row) &&
        row.length >= 18 &&
        row[0] != null &&
        String(row[0]).trim() !== ''
      );

    for (let i = 0; i < detaliatRows.length; i++) {
      const row = detaliatRows[i];
      if (!row || row.length < 18) {
        await db.close();
        return NextResponse.json({ error: `Rândul ${i + 3} din worksheet 1 nu are 18 coloane`, row }, { status: 400 });
      }
      const error = validateDetaliatRow(row, i);
      if (error) {
        await db.close();
        return NextResponse.json({ error }, { status: 400 });
      }
    }

    insertStmt = await db.prepare(`
      INSERT INTO RAPORT_ACHIZITII_DETALIAT (
        ID_RAPORT, NR_CRT, COD_ACHIZITIE, COD_LINIE_BUG_CHELTUIELI, PROMOTOR_PROIECT,
        TIP_PROIECT, DENUMIRE_ACHIZITIE, VAL_FARA_TVA, PROCEDURA_APLICATA_LEGE, COD_CPV,
        VAL_TVA, NR_CONTRACT, DATA_CONTRACT, CUI, NUME_FURNIZOR, DATE_FINALIZARE,
        RESPONSABIL_ACHIZITIE, OBSERVATII, VERIFICARE_ANAP
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const row of detaliatRows) {
      const values = [
        idRaport,
        ...row.slice(0, 18)
      ];
      await insertStmt.run(values);
    }

    await db.run(
      `INSERT INTO uploads (user, file_name, page, uploaded_at) VALUES (?, ?, ?, ?)`,
      [user, fileName, "achizitii", new Date().toISOString()]
    );

    await insertStmt.finalize();
    await db.close();

    return NextResponse.json({ success: true, idRaport });

  } catch (err) {
    if (insertStmt) {
      try { await insertStmt.finalize(); } catch { }
    }
    if (db) {
      try { await db.close(); } catch { }
    }
    console.error('Eroare la upload-excel-achizitii:', err);
    let errorMsg = '';
    if (err instanceof Error) {
      errorMsg = err.message;
    } else {
      errorMsg = JSON.stringify(err);
    }
    return NextResponse.json({ error: 'Eroare la inserare în baza de date', details: errorMsg }, { status: 500 });
  }
}