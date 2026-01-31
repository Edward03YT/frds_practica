import { NextRequest, NextResponse } from "next/server";
import Database from "better-sqlite3";
import * as XLSX from "xlsx";
import { verifyToken } from '../../lib/auth';
import { cookies } from 'next/headers';

type ValCheltuitaMap = Record<string, number | null>;

interface PaapRow {
  cod_unic_identificare: string | null;
  tip: string | null;
  promotor_proiect: string | null;
  tip_si_obiect_contract: string | null;
  cod_cpv: string | null;
  val_estimata: number;
  val_cheltuita: number | null;
  rest_contractat: number;
  sursa_finantare: string | null;
  procedura_stabilita: string | null;
  data_estimata_ini: string | null;
  data_estimata_atri: string | null;
  modalitate_derulare: string | null;
  persoana_responsabila: string | null;
}

const db = new Database("database.sqlite");

async function getUserFromRequest(req: NextRequest): Promise<any> {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) return null;
  const user = verifyToken(token);
  return user;
}

function rowToCompareObj(row: any[], valCheltuitaMap: ValCheltuitaMap): PaapRow {
  const cod_unic = row[0]?.toString().trim().toUpperCase() || null;
  const val_estimata = parseFloat((row[5] || "0").toString().replace(/\./g, '').replace(',', '.'));

  let val_cheltuita: number | null = null;
  if (cod_unic && Object.prototype.hasOwnProperty.call(valCheltuitaMap, cod_unic)) {
    val_cheltuita = valCheltuitaMap[cod_unic];
  }

  const rest_contractat = Number((val_estimata - (val_cheltuita || 0)).toFixed(2));

  // Log pentru fiecare rând PAAP
  console.log(`[PAAP] cod_unic: "${cod_unic}" | val_cheltuita găsită:`, val_cheltuita, "| rest_contractat:", rest_contractat);

  return {
    cod_unic_identificare: cod_unic,
    tip: row[1]?.toString() || null,
    promotor_proiect: row[2]?.toString() || null,
    tip_si_obiect_contract: row[3]?.toString() || null,
    cod_cpv: row[4]?.toString() || null,
    val_estimata,
    val_cheltuita,
    rest_contractat,
    sursa_finantare: row[6]?.toString() || null,
    procedura_stabilita: row[7]?.toString() || null,
    data_estimata_ini: row[8]?.toString() || null,
    data_estimata_atri: row[9]?.toString() || null,
    modalitate_derulare: row[10]?.toString() || null,
    persoana_responsabila: row[11]?.toString() || null
  };
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ success: false, error: "Neautentificat" }, { status: 401 });
  }

  // 1. Citește PAAP din paap_files
  const paapFileRow = db.prepare(`
    SELECT file_content FROM paap_files
    WHERE user = ?
    ORDER BY updated_at DESC
    LIMIT 1
  `).get(user.username) as { file_content: Buffer } | undefined;

  // 2. Citește rap_achizitii din files (corect: user_id și file_content)
  const raportFileRow = db.prepare(`
    SELECT file_content FROM files
    WHERE user_id = ?
    ORDER BY uploaded_at DESC
    LIMIT 1
  `).get(user.username) as { file_content: Buffer } | undefined;

  if (!paapFileRow || !paapFileRow.file_content) {
    return NextResponse.json({ success: false, error: "Nu există niciun fișier PAAP pentru acest user" }, { status: 404 });
  }
  if (!raportFileRow || !raportFileRow.file_content) {
    return NextResponse.json({ success: false, error: "Nu există niciun fișier rap_achizitii pentru acest user" }, { status: 404 });
  }

  // 3. Parsează ambele fișiere Excel
  const paapBuffer = Buffer.from(paapFileRow.file_content);
  const paapWb = XLSX.read(paapBuffer, { type: "buffer" });

  const raportBuffer = Buffer.from(raportFileRow.file_content);
  const raportWb = XLSX.read(raportBuffer, { type: "buffer" });

  // 4. Construiește maparea cod_unic -> val_cheltuita din rap_achizitii
  const valCheltuitaMap: ValCheltuitaMap = {};
  if (raportWb.SheetNames.length > 0) {
    const raportSheet = raportWb.Sheets[raportWb.SheetNames[0]];
    const raportData: any[][] = XLSX.utils.sheet_to_json(raportSheet, { header: 1 });

    // Ignoră primele 6 rânduri (primele 6 sunt header/meta)
    for (let r = 6; r < raportData.length; r++) {
      const row = raportData[r];
      if (!row) continue;
      // cod unic: col 3 (index 2), valoare cheltuita: col 10 (index 9)
      const cod_unic = row[2]?.toString().trim().toUpperCase();
      const val_cheltuita = parseFloat((row[9] || "0").toString().replace(/\./g, '').replace(',', '.'));
      console.log(`[RAPORT] rând ${r}: cod_unic="${cod_unic}", val_cheltuita="${val_cheltuita}"`);
      if (cod_unic) {
        valCheltuitaMap[cod_unic] = isNaN(val_cheltuita) ? null : val_cheltuita;
      }
    }
    console.log("=== Mapare cod_unic -> val_cheltuita ===");
    console.log(valCheltuitaMap);
  }

  // 5. Extrage datele noi din PAAP
  const newRows: PaapRow[] = [];
  const paapSheet = paapWb.Sheets[paapWb.SheetNames[0]];
  const paapData: any[][] = XLSX.utils.sheet_to_json(paapSheet, { header: 1 });

  for (let r = 2; r < paapData.length; r++) {
    const row = paapData[r];
    if (!row || row.length < 12) continue;
    newRows.push(rowToCompareObj(row, valCheltuitaMap));
  }

  // 6. Verifică dacă există vreun rest_contractat < 0
  const negativeRows = newRows.filter(row => row.rest_contractat < 0);
  if (negativeRows.length > 0) {
    const coduri = negativeRows.map(row => row.cod_unic_identificare).join(", ");
    return NextResponse.json({
      success: false,
      error: `Atenție! Pentru codurile: ${coduri} valoarea cheltuită depășește valoarea estimată. Nu s-au salvat datele!`
    }, { status: 400 });
  }

  // 7. Extrage datele vechi din baza de date pentru user
  const oldRows = db.prepare(`
    SELECT cod_unic_identificare, tip, promotor_proiect, tip_si_obiect_contract, cod_cpv, val_estimata, val_cheltuita, rest_contractat, sursa_finantare, procedura_stabilita, data_estimata_ini, data_estimata_atri, modalitate_derulare, persoana_responsabila
    FROM paap_detaliat
    WHERE user = ?
    ORDER BY cod_unic_identificare
  `).all(user.username);

  // 8. Compară datele (ca JSON)
  const oldRowsJSON = JSON.stringify(oldRows.map((r: any) => ({
    ...r,
    val_estimata: Number(r.val_estimata)
  })));
  const newRowsJSON = JSON.stringify(newRows);

  if (oldRowsJSON === newRowsJSON) {
    return NextResponse.json({ success: false, error: "Nu s-a modificat nimic" });
  }

  // 9. Dacă s-au modificat datele, șterge tot pentru user și inserează din nou
  const deleteStmt = db.prepare("DELETE FROM paap_detaliat WHERE user = ?");
  deleteStmt.run(user.username);

  const insertStmt = db.prepare(`
    INSERT INTO paap_detaliat (
      user, cod_unic_identificare, tip, promotor_proiect,
      tip_si_obiect_contract, cod_cpv, val_estimata, val_cheltuita, rest_contractat,
      sursa_finantare, procedura_stabilita, data_estimata_ini, data_estimata_atri,
      modalitate_derulare, persoana_responsabila
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const row of newRows) {
    insertStmt.run(
      user.username,
      row.cod_unic_identificare,
      row.tip,
      row.promotor_proiect,
      row.tip_si_obiect_contract,
      row.cod_cpv,
      row.val_estimata,
      row.val_cheltuita,
      row.rest_contractat,
      row.sursa_finantare,
      row.procedura_stabilita,
      row.data_estimata_ini,
      row.data_estimata_atri,
      row.modalitate_derulare,
      row.persoana_responsabila
    );
  }

  return NextResponse.json({ success: true, message: "Datele au fost actualizate!" });
}