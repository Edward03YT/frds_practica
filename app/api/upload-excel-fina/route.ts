import { NextRequest, NextResponse } from 'next/server';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Funcție pentru deschiderea bazei de date
async function openDb() {
    return open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });
}

// Funcție de validare pentru fiecare celulă
function validateCell(value: any, colIndex: number, rowIndex: number, isFirstSheet: boolean): string | null {
    const stringValue = value == null ? '' : String(value).trim();
    if (rowIndex === 0 || rowIndex === 1) return null;
    if (isFirstSheet && colIndex === 1 && stringValue) {
        const validColumn2Regex = /^[a-zA-Z0-9]$/;
        if (!validColumn2Regex.test(stringValue)) {
            return 'Coloana 2 trebuie să conțină un singur caracter (literă sau cifră)';
        }
    }
    if (isFirstSheet && colIndex === 2 && stringValue) {
        const validColumn3Regex = /^[a-zA-Z0-9](\.\d+)+$/;
        if (!validColumn3Regex.test(stringValue)) {
            return 'Coloana 3 trebuie să înceapă cu o literă sau cifră, urmată de "." și cifre (ex: A.1.1, 1.1.1, B.2.3.4)';
        }
    }
    if (isFirstSheet && colIndex === 4 && stringValue) {
        if (!['G', 'CM', 'CB'].includes(stringValue.toUpperCase())) {
            return 'Doar literele G, CM, CB sunt permise';
        }
    }
    if (isFirstSheet && colIndex === 5 && stringValue && !/^P(\d+)$/.test(stringValue)) {
        return 'Trebuie să înceapă cu P și să urmeze fie un alt P, fie cifre (ex: P1, P23)';
    }
    if (isFirstSheet && colIndex === 10 && rowIndex > 0 && stringValue && !/^(RO)?\d{1,10}$/i.test(stringValue)) {
        return 'CUI trebuie să conțină doar cifre, opțional prefixat cu "RO".';
    }
    if (isFirstSheet && colIndex === 13 && rowIndex > 0 && stringValue && !/^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(stringValue)) {
        return 'Coloana 15: Data trebuie să fie în formatul DD/MM/YYYY.';
    }
    if (isFirstSheet && colIndex === 15 && stringValue) {
        if (!['X', ''].includes(stringValue.toUpperCase())) {
            return 'Doar sa contina X sau " " permise';
        }
    }
    if (isFirstSheet && colIndex === 16 && stringValue) {
        const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
        if (!numberFormatRegex.test(stringValue)) {
            return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
        }
    }
    if (isFirstSheet && colIndex === 17 && stringValue) {
        const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
        if (!numberFormatRegex.test(stringValue)) {
            return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
        }
    }
    if (isFirstSheet && colIndex === 18 && stringValue) {
        const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
        if (!numberFormatRegex.test(stringValue)) {
            return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
        }
        return null;
    }
    if (isFirstSheet && colIndex === 19 && stringValue) {
        const numberFormatRegex = /^\d{1,3}(,\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;
        if (!numberFormatRegex.test(stringValue)) {
            return 'Trebuie să fie un număr cu maxim 2 zecimale (ex: 10, 10.5, 10.55, 1,000.25)';
        }
        return null;
    }
    return null;
}

// Funcție robustă pentru orice format de număr din Excel
function parseExcelNumber(val: any): number {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    let s = val.trim();
    if (/^\d{1,3}(\.\d{3})+,\d{1,2}$/.test(s)) {
        s = s.replace(/\./g, '').replace(',', '.');
    } else if (/^\d{1,3}(,\d{3})+\.\d{1,2}$/.test(s)) {
        s = s.replace(/,/g, '');
    } else if (/^\d+,\d{1,2}$/.test(s)) {
        s = s.replace(',', '.');
    }
    return Number(s) || 0;
}

export async function POST(req: NextRequest) {
    let db: any = null;
    let insertStmt: any = null;
    try {
        const body = await req.json();
        const { userId, fileName, sheetNames, sheetsData } = body;

        // === VALIDARE userId ===
        if (!userId) {
            return NextResponse.json({ error: 'Lipsește userId!' }, { status: 400 });
        }

        if (!sheetNames || !sheetsData || sheetNames.length < 1) {
            return NextResponse.json({ error: 'Fișierul trebuie să aibă cel puțin 1 sheet' }, { status: 400 });
        }

        const detaliatRows = sheetsData[sheetNames[0]] || [];
        if (detaliatRows.length < 3) {
            return NextResponse.json({ error: 'Worksheet 1 nu are suficiente rânduri', detaliatRows }, { status: 400 });
        }

        // === SKIP ultimele 6 rânduri ===
        const lastRowToValidate = detaliatRows.length - 6;

        // VALIDARE
        for (let rowIndex = 2; rowIndex < lastRowToValidate; rowIndex++) {
            const row = detaliatRows[rowIndex];
            if (!row) continue;
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const error = validateCell(row[colIndex], colIndex, rowIndex, true);
                if (error) {
                    return NextResponse.json({ error: `Rândul ${rowIndex + 1}, coloana ${colIndex + 1}: ${error}` }, { status: 400 });
                }
            }
        }

        db = await openDb();

        // === HEADER: UPDATE dacă există, altfel INSERT ===
        const rap = await db.get('SELECT ID FROM RAPORT_FINANCIAR WHERE ID = 1');
        if (!rap) {
            await db.run(`
                INSERT INTO RAPORT_FINANCIAR (
                    COD_PROIECT, NR_RAPORT, DATA_INCEPUT, DATA_SFARSIT, TOTAL_SUM_SF_PROIECT, CAPITOLE_BUG, BUGET_PROIECT, TOTAL_CHELTUIELI_AUT_ANTERIOR, PROMOTOR_PROIECT, RESPONSABIL_FINANCIAR, NR_INREGISTRARI
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                'PRJ_TEST', 1, '2024-01-01', '2024-12-31', 0, 'A', 0, 0, 'Promotor', 'Responsabil', 0
            ]);
        } else {
            await db.run(`
                UPDATE RAPORT_FINANCIAR SET
                    COD_PROIECT = ?,
                    NR_RAPORT = ?,
                    DATA_INCEPUT = ?,
                    DATA_SFARSIT = ?,
                    TOTAL_SUM_SF_PROIECT = ?,
                    CAPITOLE_BUG = ?,
                    BUGET_PROIECT = ?,
                    TOTAL_CHELTUIELI_AUT_ANTERIOR = ?,
                    PROMOTOR_PROIECT = ?,
                    RESPONSABIL_FINANCIAR = ?,
                    NR_INREGISTRARI = ?
                WHERE ID = 1
            `, [
                'PRJ_TEST', 1, '2024-01-01', '2024-12-31', 0, 'A', 0, 0, 'Promotor', 'Responsabil', 0
            ]);
        }

        // === ȘTERGE rândurile care nu mai există în Excel ===
        const ID_RAP = 1;
        const nrCrtList: any[] = [];
        for (let rowIndex = 2; rowIndex < lastRowToValidate; rowIndex++) {
            const row = detaliatRows[rowIndex];
            if (!row) continue;
            nrCrtList.push(row[0]);
        }
        if (nrCrtList.length > 0) {
            await db.run(
                `DELETE FROM RAPORT_FINANCIAR_DETALIAT WHERE ID_RAP = ? AND NR_CRT NOT IN (${nrCrtList.map(() => '?').join(',')})`,
                [ID_RAP, ...nrCrtList]
            );
        }

        // === INSERT OR REPLACE pentru fiecare linie ===
        insertStmt = await db.prepare(`
            INSERT OR REPLACE INTO RAPORT_FINANCIAR_DETALIAT (
                ID_RAP, NR_CRT, COD_CAP_BUG, COD_LINIE_BUG, COD_ACTIVITATE, SURSA_FINANTARE, PARTENER,
                DESCRIERE_CHELTUIELI, NR_DATA_FACTURA, FURNIZOR, CONTRACT_INCHEIAT, CUI, IDENTIFICARE_ACHIZITIE,
                DOCUMENT_PLATA, DATA_PLATA, INREG_CHELTUIELI_CONT, RAPORTATA_ANTERIOR, VALOARE_CHELTUIELI,
                SUMA_ELIGIBILA, PLATA_GRANT_EXTERN, PLATA_GRANT_PUBLICA
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let rowsInserted = 0;
        for (let rowIndex = 2; rowIndex < lastRowToValidate; rowIndex++) {
            const row = detaliatRows[rowIndex];
            if (!row) continue;

            while (row.length < 20) row.push(0);

            let raportata = row[15];
            if (typeof raportata === 'string' && raportata.trim().toUpperCase() === 'X') {
                raportata = 1;
            } else {
                raportata = 0;
            }

            const valoareCheltuieli = parseExcelNumber(row[16]);
            const sumaEligibila = parseExcelNumber(row[17]);
            const grantExtern = parseExcelNumber(row[18]);
            const grantPublica = parseExcelNumber(row[19]);

            const values = [
                ID_RAP,
                row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8], row[9],
                row[10], row[11], row[12], row[13], row[14],
                raportata,
                valoareCheltuieli,
                sumaEligibila,
                grantExtern,
                grantPublica
            ];

            try {
                await insertStmt.run(values);
                rowsInserted++;
            } catch (insertErr) {
                if (insertStmt) { try { await insertStmt.finalize(); } catch { } }
                if (db) { try { await db.close(); } catch { } }
                let details = '';
                if (insertErr instanceof Error) {
                    details = insertErr.message;
                } else {
                    details = JSON.stringify(insertErr);
                }
                return NextResponse.json({
                    error: `Eroare la INSERT pe rândul ${rowIndex}`,
                    details,
                    values
                }, { status: 500 });
            }
        }

        await insertStmt.finalize();
        await db.close();

        return NextResponse.json({ success: true, rowsInserted });
    } catch (err) {
        if (insertStmt) { try { await insertStmt.finalize(); } catch { } }
        if (db) { try { await db.close(); } catch { } }
        console.error('Eroare la upload-excel-fina:', err);
        let errorMsg = '';
        if (err instanceof Error) {
            errorMsg = err.message;
        } else {
            errorMsg = JSON.stringify(err);
        }
        return NextResponse.json({ error: 'Eroare la inserare în baza de date', details: errorMsg }, { status: 500 });
    }
}