const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(process.cwd(), 'database.sqlite');
console.log('📍 Calea către baza de date:', dbPath);

if (fs.existsSync(dbPath)) {
  console.log('⚠️  Baza de date există deja. O voi suprascrie...');
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);
console.log('✅ Fișierul bazei de date a fost creat:', dbPath);
console.log('🚀 Inițializarea bazei de date...');

// 🔍 Activare debug global pentru SQL
console.log('🛠️ Activare mod DEBUG SQL...');
const originalPrepare = db.prepare.bind(db);
db.prepare = function (sql) {
  console.debug('📥 SQL PREPARE:', sql);
  const stmt = originalPrepare(sql);

  const originalRun = stmt.run.bind(stmt);
  stmt.run = function (...params) {
    console.debug('▶️ RUN with params:', params);
    return originalRun(...params);
  };

  const originalGet = stmt.get.bind(stmt);
  stmt.get = function (...params) {
    console.debug('📤 GET with params:', params);
    return originalGet(...params);
  };

  const originalAll = stmt.all.bind(stmt);
  stmt.all = function (...params) {
    console.debug('📤 ALL with params:', params);
    return originalAll(...params);
  };

  return stmt;
};

db.pragma('foreign_keys = ON');

const schema = `
------------------------------------------------------------
-- SCHEMA ORIGINARA – DEFINIRE TABELE
------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    is_moderator INTEGER NOT NULL DEFAULT 0, 
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_ip TEXT,
    cod_proiect varchar(10) NOT NULL,
    telefon varchar(15) NOT NULL,
    judet varchar(30) NOT NULL,
    localitate varchar(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS uploads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    file_name TEXT NOT NULL,
    page TEXT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS RAPORT_ACHIZITII(
    ID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    COD_PROIECT VARCHAR NOT NULL,
    NR_RAPORT INTEGER NOT NULL,
    DATA_INCEPUT DATE NOT NULL,
    DATA_FINAL DATE NOT NULL,
    PRIMAR VARCHAR NOT NULL,
    COODONATOR_PROIECT VARCHAR NOT NULL,
    EXPERT_ACHIZITII_PUBLICE VARCHAR NOT NULL,
    NR_INREGISTRARI INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS RAPORT_ACHIZITII_DETALIAT (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_RAPORT INTEGER NOT NULL,
    NR_CRT INTEGER NOT NULL,
    COD_ACHIZITIE VARCHAR NOT NULL,
    COD_LINIE_BUG_CHELTUIELI VARCHAR NOT NULL,
    PROMOTOR_PROIECT VARCHAR NOT NULL,
    TIP_PROIECT VARCHAR NOT NULL,
    DENUMIRE_ACHIZITIE VARCHAR NOT NULL,
    VAL_FARA_TVA FLOAT NOT NULL,
    PROCEDURA_APLICATA_LEGE VARCHAR NOT NULL,
    COD_CPV TEXT NOT NULL,
    VAL_TVA FLOAT NOT NULL,
    NR_CONTRACT INTEGER NOT NULL,
    DATA_CONTRACT DATE NOT NULL,
    CUI VARCHAR NOT NULL,
    NUME_FURNIZOR VARCHAR NOT NULL,
    DATE_FINALIZARE DATE NOT NULL,
    RESPONSABIL_ACHIZITIE VARCHAR NOT NULL,
    OBSERVATII TEXT,
    VERIFICARE_ANAP VARCHAR(3) NOT NULL DEFAULT 'NU',
    FOREIGN KEY (ID_RAPORT) REFERENCES RAPORT_ACHIZITII(ID)
);

CREATE TABLE IF NOT EXISTS RAPORT_FINANCIAR (
    ID INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    COD_PROIECT VARCHAR NOT NULL,
    NR_RAPORT INTEGER NOT NULL,
    DATA_INCEPUT DATE NOT NULL,
    DATA_SFARSIT DATE NOT NULL,
    TOTAL_SUM_SF_PROIECT FLOAT NOT NULL,
    CAPITOLE_BUG VARCHAR NOT NULL,
    BUGET_PROIECT FLOAT NOT NULL,
    TOTAL_CHELTUIELI_AUT_ANTERIOR FLOAT NOT NULL,
    PROMOTOR_PROIECT VARCHAR NOT NULL,
    RESPONSABIL_FINANCIAR VARCHAR NOT NULL,
    NR_INREGISTRARI INTEGER NOT NULL 
);

CREATE TABLE IF NOT EXISTS RAPORT_FINANCIAR_DETALIAT (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_RAP INTEGER NOT NULL,
    NR_CRT INTEGER NOT NULL,
    COD_CAP_BUG VARCHAR NOT NULL,
    COD_LINIE_BUG VARCHAR NOT NULL,
    COD_ACTIVITATE VARCHAR NOT NULL,
    SURSA_FINANTARE VARCHAR NOT NULL,
    PARTENER VARCHAR NOT NULL,
    DESCRIERE_CHELTUIELI TEXT NOT NULL,
    NR_DATA_FACTURA VARCHAR NOT NULL,
    FURNIZOR VARCHAR,
    CONTRACT_INCHEIAT VARCHAR,
    CUI VARCHAR,
    IDENTIFICARE_ACHIZITIE VARCHAR,
    DOCUMENT_PLATA VARCHAR NOT NULL,
    DATA_PLATA DATE NOT NULL,
    INREG_CHELTUIELI_CONT FLOAT,
    RAPORTATA_ANTERIOR VARCHAR(3) NOT NULL DEFAULT 'NU',
    VALOARE_CHELTUIELI FLOAT NOT NULL,
    SUMA_ELIGIBILA FLOAT NOT NULL,
    PLATA_GRANT_EXTERN FLOAT NOT NULL,
    PLATA_GRANT_PUBLICA FLOAT NOT NULL,
    FOREIGN KEY (ID_RAP) REFERENCES RAPORT_FINANCIAR(ID)
);

CREATE TABLE IF NOT EXISTS user_announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS announcements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pdf_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    dosar_id INTEGER,
    file_name TEXT NOT NULL,
    file_content BLOB NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    description TEXT,
    FOREIGN KEY (user_id) REFERENCES users(username)
);

CREATE TABLE IF NOT EXISTS dosare (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    denumire TEXT NOT NULL,
    autoritate TEXT NOT NULL,
    tip TEXT NOT NULL,
    numar_anunt TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paap_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    name TEXT NOT NULL,
    file_content BLOB,
    NR_Inregistari INTEGER DEFAULT 0,
    version INTEGER NOT NULL DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paap_files_backup (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paap_file_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    file_content BLOB,
    NR_Inregistari INTEGER,
    version INTEGER,
    backup_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS paap_detaliat (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT,
    cod_unic_identificare TEXT,
    tip TEXT,
    promotor_proiect TEXT,
    tip_si_obiect_contract TEXT,
    cod_cpv TEXT,
    val_estimata REAL,
    val_cheltuita REAL,
    rest_contractat REAL,
    sursa_finantare Varchar(6),
    procedura_stabilita TEXT,
    data_estimata_ini TEXT,
    data_estimata_atri TEXT,
    modalitate_derulare TEXT,
    persoana_responsabila TEXT
);

CREATE TABLE IF NOT EXISTS paap_totaluri (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    upload_id INTEGER,
    user TEXT,
    tip TEXT,
    suma REAL,
    data_upload DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Audit (
   user TEXT(100) NOT NULL,
   Actiune VARCHAR(100) NOT NULL,
   timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
   MESAJ TEXT
);

CREATE TABLE IF NOT EXISTS section_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    section_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_content BLOB NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(username)
);

------------------------------------------------------------
-- TRIGGER-E & INDEXURI EXTRA
------------------------------------------------------------

-- Users updated_at
DROP TRIGGER IF EXISTS update_users_updated_at;
CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
WHEN NEW.updated_at = OLD.updated_at
BEGIN
    UPDATE users SET updated_at = DATETIME('now') WHERE id = OLD.id;
END;

-- Audit: users
CREATE TRIGGER IF NOT EXISTS trg_users_insert_audit
AFTER INSERT ON users
FOR EACH ROW
BEGIN
  INSERT INTO Audit(user, Actiune, MESAJ)
  VALUES (NEW.username, 'INSERT USER', 'Creat utilizator: ' || NEW.username);
END;

CREATE TRIGGER IF NOT EXISTS trg_users_update_audit
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  INSERT INTO Audit(user, Actiune, MESAJ)
  VALUES (NEW.username, 'UPDATE USER', 'Modificat utilizator: ' || NEW.username);
END;

CREATE TRIGGER IF NOT EXISTS trg_users_delete_audit
AFTER DELETE ON users
FOR EACH ROW
BEGIN
  INSERT INTO Audit(user, Actiune, MESAJ)
  VALUES (OLD.username, 'DELETE USER', 'Șters utilizator: ' || OLD.username);
END;

-- Backup paap_files
CREATE TRIGGER IF NOT EXISTS trg_paap_files_backup
AFTER UPDATE ON paap_files
FOR EACH ROW
BEGIN
  INSERT INTO paap_files_backup (paap_file_id, name, file_content, NR_Inregistari, version)
  VALUES (OLD.id, OLD.name, OLD.file_content, OLD.NR_Inregistari, OLD.version);
END;

-- Versioning paap_files
DROP TRIGGER IF EXISTS trg_paap_files_version_update;
CREATE TRIGGER trg_paap_files_version_update
AFTER UPDATE ON paap_files
FOR EACH ROW
BEGIN
  UPDATE paap_files
  SET version = OLD.version + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

-- Paap_totaluri sync
CREATE TRIGGER IF NOT EXISTS trg_paap_totaluri_update
AFTER INSERT ON paap_detaliat
FOR EACH ROW
BEGIN
  INSERT INTO paap_totaluri (upload_id, user, tip, suma)
  VALUES (NEW.id, NEW.user, NEW.tip, NEW.val_estimata)
  ON CONFLICT(upload_id) DO UPDATE SET 
     suma = suma + NEW.val_estimata,
     data_upload = CURRENT_TIMESTAMP;
END;

-- Achizitii sync
CREATE TRIGGER IF NOT EXISTS trg_achizitii_det_insert
AFTER INSERT ON RAPORT_ACHIZITII_DETALIAT
FOR EACH ROW
BEGIN
  UPDATE RAPORT_ACHIZITII
  SET NR_INREGISTRARI = NR_INREGISTRARI + 1
  WHERE ID = NEW.ID_RAPORT;
END;

CREATE TRIGGER IF NOT EXISTS trg_achizitii_det_delete
AFTER DELETE ON RAPORT_ACHIZITII_DETALIAT
FOR EACH ROW
BEGIN
  UPDATE RAPORT_ACHIZITII
  SET NR_INREGISTRARI = NR_INREGISTRARI - 1
  WHERE ID = OLD.ID_RAPORT;
END;

-- Financiar sync
CREATE TRIGGER IF NOT EXISTS trg_financiar_det_insert
AFTER INSERT ON RAPORT_FINANCIAR_DETALIAT
FOR EACH ROW
BEGIN
  UPDATE RAPORT_FINANCIAR
  SET NR_INREGISTRARI = NR_INREGISTRARI + 1
  WHERE ID = NEW.ID_RAP;
END;

CREATE TRIGGER IF NOT EXISTS trg_financiar_det_delete
AFTER DELETE ON RAPORT_FINANCIAR_DETALIAT
FOR EACH ROW
BEGIN
  UPDATE RAPORT_FINANCIAR
  SET NR_INREGISTRARI = NR_INREGISTRARI - 1
  WHERE ID = OLD.ID_RAP;
END;

-- section_documents auto update
CREATE TRIGGER IF NOT EXISTS trg_section_documents_update
AFTER UPDATE ON section_documents
FOR EACH ROW
BEGIN
  UPDATE section_documents
  SET uploaded_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

-- Indexuri extra
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_uploads_user ON uploads(user);
CREATE INDEX IF NOT EXISTS idx_paap_user ON paap_files(user);
CREATE INDEX IF NOT EXISTS idx_paap_backup_fileid ON paap_files_backup(paap_file_id);
CREATE INDEX IF NOT EXISTS idx_section_documents_user ON section_documents(user_id, section_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unic_rapfin ON RAPORT_FINANCIAR_DETALIAT (ID_RAP, NR_CRT);
CREATE UNIQUE INDEX IF NOT EXISTS idx_unic_achizitii ON RAPORT_ACHIZITII_DETALIAT (ID_RAPORT, NR_CRT);

`;

try {
  db.exec(schema);
  console.log('✅ Schema bazei de date a fost creată cu succes!');
  console.log('📝 Adăugarea datelor de test...');

  // MODIFICAT: Adăugat valoarea pentru is_admin (0 pentru user normal, 1 pentru admin)
  const users = [
    // username, name, email, password, is_admin, is_moderator, cod_proiect, telefon, judet, localitate
    ['ion.popescu', 'Ion Popescu', 'ion.popescu@example.com', 'password123', 0, 1, 'PRJ001', '0712345678', 'Cluj', 'Cluj-Napoca'],
    ['maria.ionescu', 'Maria Ionescu', 'maria.ionescu@example.com', 'password123', 0, 1, 'PRJ002', '0723456789', 'Bucuresti', 'Sector 1'],
    ['alex.dumitru', 'Alexandru Dumitru', 'alex.dumitru@example.com', 'password123', 0, 0, 'PRJ003', '0734567890', 'Timis', 'Timisoara'],
    ['test', 'Test Admin', 'test.admin@example.com', 'test123', 1, 1, 'PRJ999', '0745678901', 'Ilfov', 'Otopeni'],
    ['andreea.stan', 'Andreea Stănescu', 'andreea.stan@example.com', 'password123', 0, 0, 'PRJ004', '0756789012', 'Iasi', 'Iasi'],
    ['george.mihai', 'George Mihai', 'george.mihai@example.com', 'password123', 0, 1, 'PRJ005', '0767890123', 'Brasov', 'Brasov'],
    ['elena.marin', 'Elena Marin', 'elena.marin@example.com', 'password123', 0, 0, 'PRJ006', '0778901234', 'Constanta', 'Constanta'],
    ['daniel.rafila', 'Daniel Rafila', 'daniel.rafila@example.com', 'password123', 0, 0, 'PRJ007', '0789012345', 'Prahova', 'Ploiesti'],
    ['ioana.neagu', 'Ioana Neagu', 'ioana.neagu@example.com', 'password123', 0, 1, 'PRJ008', '0790123456', 'Dolj', 'Craiova'],
    ['cristian.ilie', 'Cristian Ilie', 'cristian.ilie@example.com', 'password123', 0, 0, 'PRJ009', '0701234567', 'Galati', 'Galati'],
    ['roxana.ciobanu', 'Roxana Ciobanu', 'roxana.ciobanu@example.com', 'password123', 0, 0, 'PRJ010', '0712233445', 'Arad', 'Arad'],
    ['florin.moraru', 'Florin Moraru', 'florin.moraru@example.com', 'password123', 0, 1, 'PRJ011', '0723344556', 'Bihor', 'Oradea'],
    ['laura.pop', 'Laura Pop', 'laura.pop@example.com', 'password123', 1, 1, 'PRJ012', '0734455667', 'Sibiu', 'Sibiu'],
    ['vlad.enache', 'Vlad Enache', 'vlad.enache@example.com', 'password123', 0, 0, 'PRJ013', '0745566778', 'Bacau', 'Bacau'],
    ['alina.radu', 'Alina Radu', 'alina.radu@example.com', 'password123', 0, 0, 'PRJ014', '0756677889', 'Botosani', 'Botosani'],
    ['cosmin.dobre', 'Cosmin Dobre', 'cosmin.dobre@example.com', 'password123', 0, 1, 'PRJ015', '0767788990', 'Arges', 'Pitesti'],
    ['gabriela.voicu', 'Gabriela Voicu', 'gabriela.voicu@example.com', 'password123', 0, 0, 'PRJ016', '0778899001', 'Hunedoara', 'Deva'],
    ['paul.ghita', 'Paul Ghita', 'paul.ghita@example.com', 'password123', 0, 0, 'PRJ017', '0789900112', 'Suceava', 'Suceava'],
    ['diana.dragomir', 'Diana Dragomir', 'diana.dragomir@example.com', 'password123', 0, 1, 'PRJ018', '0791001223', 'Mures', 'Targu Mures'],
    ['radu.mocanu', 'Radu Mocanu', 'radu.mocanu@example.com', 'password123', 0, 0, 'PRJ019', '0702112334', 'Vaslui', 'Vaslui'],
    ['irina.zaharia', 'Irina Zaharia', 'irina.zaharia@example.com', 'password123', 0, 0, 'PRJ020', '0713223445', 'Teleorman', 'Alexandria'],
    ['ovidiu.necula', 'Ovidiu Necula', 'ovidiu.necula@example.com', 'password123', 0, 1, 'PRJ021', '0724334556', 'Giurgiu', 'Giurgiu'],
    ['miruna.andrei', 'Miruna Andrei', 'miruna.andrei@example.com', 'password123', 0, 0, 'PRJ022', '0735445667', 'Calarasi', 'Calarasi'],
    ['tudor.sorescu', 'Tudor Sorescu', 'tudor.sorescu@example.com', 'password123', 1, 1, 'PRJ023', '0746556778', 'Mehedinti', 'Drobeta-Turnu Severin'],
    ['anastasia.nedelcu', 'Anastasia Nedelcu', 'anastasia.nedelcu@example.com', 'password123', 0, 0, 'PRJ024', '0757667889', 'Neamt', 'Piatra Neamt']
  ];
  // HASHUIRE PAROLE!
  const usersHashed = users.map(user => {
    const hashedPassword = bcrypt.hashSync(user[3], 10); // user[3] = parola
    return [...user.slice(0, 3), hashedPassword, ...user.slice(4)];
  });

  const insertUser = db.prepare(`
  INSERT INTO users 
  (username, name, email, password, is_admin, is_moderator, cod_proiect, telefon, judet, localitate)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

  // FOLOSESTE usersHashed, NU users!
  usersHashed.forEach(user => insertUser.run(...user));

  console.log('✅ Datele de test au fost adăugate cu succes!');

  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_admin = 1').get().count;
  console.log('\n📊 Statistici bază de date:');
  console.log(`   Utilizatori: ${userCount} (inclusiv ${adminCount} administratori)`);
  console.log(`   Tabel Raport Achizitii: ${db.prepare('SELECT COUNT(*) as count FROM RAPORT_ACHIZITII').get().count}`);
  console.log(`   Tabel Raport Financiar: ${db.prepare('SELECT COUNT(*) as count FROM RAPORT_FINANCIAR').get().count}`);

} catch (error) {
  console.error('❌ Eroare la inițializarea bazei de date:', error);
} finally {
  db.close();
  console.log('\n🎉 Inițializarea bazei de date finalizată!');
}