# 🚀 Next.js + better-sqlite3 Starter

Acest proiect este o aplicație web creată cu [Next.js](https://nextjs.org/) și folosește [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) pentru o bază de date locală, rapidă și sincronă. Ideal pentru aplicații fullstack, API-uri locale sau tool-uri interne.


# MIS Summer Project

## Descriere generală

Acest proiect este o aplicație web dezvoltată cu Next.js, TypeScript și Tailwind CSS, având ca scop gestionarea utilizatorilor, anunțurilor, documentelor și rapoartelor pentru o organizație. Include funcționalități de administrare, autentificare, încărcare fișiere, generare rapoarte și multe altele.

## Structura proiectului

- `app/` — Conține paginile și API routes pentru frontend și backend
  - `admin-panel/` — Panou de administrare utilizatori
  - `api/` — Rute backend pentru autentificare, utilizatori, fișiere, anunțuri etc.
  - `components/` — Componente UI reutilizabile (ex: PDFViewer, YouTubeEmbed)
  - `lib/` — Funcții de utilitate (ex: autentificare, acces DB)
  - `scripts/` — Scripturi pentru inițializare DB
  - alte pagini: `home`, `profil`, `contact`, `rapoarte`, `paap`, etc.
- `public/` — Resurse statice (imagini, PDF, template-uri Excel)
- `uploads/` — Fișiere încărcate de utilizatori
- `database.sqlite` — Baza de date SQLite
- `package.json`, `tsconfig.json`, `tailwind.config.js` — Configurări proiect

## Instalare și rulare

1. Instalează dependențele:
   ```bash
   npm install
   ```
   ```

## Funcționalități principale

---

## 📊 GitHub Stats & Insights

<p align="center">
  <img src="https://github-readme-stats.vercel.app/api?username=gtoaderFRDS&show_icons=true&theme=radical" alt="GitHub Stats" height="160"/>
  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=gtoaderFRDS&layout=compact&theme=radical" alt="Top Langs" height="160"/>
</p>

<p align="center">
  <img src="https://github-profile-summary-cards.vercel.app/api/cards/profile-details?username=gtoaderFRDS&theme=radical" alt="Profile Details"/>
</p>

---

## 📈 Alte Statistici & Fun Facts

- 🗂️ **Număr fișiere:** ~{numărul de fișiere din repo}
- 🧑‍💻 **Contribuitori:** 1 (principal: gtoaderFRDS)
- 🕒 **Ultima actualizare:** August 2025
- 🚀 **Primul commit:** 2024
- 🏆 **Progres:** 100% funcționalitate de bază implementată
- 📝 **Limbaje principale:** TypeScript, JavaScript, SQL
- 🖼️ **Resurse media:** PDF, imagini, template-uri Excel

---

- **Autentificare și administrare utilizatori**
- **Panou admin** cu filtre, căutare, paginare

## API Endpoints (exemple)

- `POST /api/auth/login` — Autentificare utilizator
- `GET /api/me` — Informații despre utilizatorul logat
- `GET/POST/DELETE /api/announcements` — Gestionare anunțuri

---

## ⚡ Quickstart

- `GET/POST /api/users` — Listare, creare utilizatori
- `DELETE /api/users?id=...` — Ștergere utilizator
- `POST /api/upload_file_excel` — Încărcare fișier Excel

## Exemple de utilizare

- Autentificare: completează formularul de login
- Acces panou admin: `/admin-panel`
- Vizualizare rapoarte: `/rapoarte`, `/rap-achizitii`, `/rap-financiar`
- Încărcare documente: `/documente`

## Ghid contribuții

- Respectă structura și convențiile de cod existente
- Adaugă comentarii și documentație la funcții noi
- Testează funcționalitățile înainte de a face un pull request


---

## 🙌 Mulțumiri & Succes!

> Dacă ai întrebări sau sugestii, deschide un issue sau un pull request! Spor la cod! 🚀
## Resurse utile

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

Pentru detalii suplimentare despre fiecare modul, consultă comentariile din cod sau creează fișiere suplimentare în folderul `docs/`.


## 📦 Tehnologii folosite

- [Next.js](https://nextjs.org/) – framework React pentru aplicații moderne
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) – SQLite
- Node.js (versiunea LTS recomandată)

---

### 1. Clonează Proiectul

```bash
git clone https://github.com/gtoaderFRDS/MIS-summer-project.git
cd MIS-summer-project
```

### 2.Instalare Pachete

```bash
npm install next react react-dom
npm install better-sqlite3

npm install loadash @types/lodash

npm install xlsx

```

### 3.Pentru Rulare 

```bash

npm run dev
```


