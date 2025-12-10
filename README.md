# Model Page Generator

Statischer Seiten-Generator für MyDirtyHobby Model-Seiten mit automatischem täglichen Deployment via GitHub Actions.

## Features

- Automatischer Video-Feed von MyDirtyHobby API
- Lokale Bild-Speicherung (SEO-optimiert, Adblocker-sicher)
- BounceBooster (Back-Button Redirect zum Profil)
- Clean URLs (`/videos/video-slug/`)
- Valide Sitemaps (sitemap_index.xml)
- Responsive Design (Mobile-First)
- GitHub Actions für tägliches Auto-Deployment per FTP (im Template deaktiviert)

---

## Neues Model einrichten

### 1. Repository klonen

```bash
git clone https://github.com/endcoreCL/model-page-generator.git model-name
cd model-name
rm -rf .git
```

### 2. Config erstellen

```bash
cp config/site.config.example.js config/site.config.js
```

Bearbeite `config/site.config.js` und ersetze:

| Placeholder | Beschreibung |
|-------------|--------------|
| `MODEL_ID` | MyDirtyHobby ID (aus Profil-URL) |
| `MODEL_NAME` | Anzeigename des Models |
| `MODEL_USERNAME` | MDH Benutzername |
| `ATS_TOKEN` | Dein Affiliate Tracking String |
| `model-domain.com` | Deine Domain |

### 3. Build & Test

```bash
npm install
npm run fetch-feed   # Lädt Videos + Profilbild
npm run build        # Generiert die Seite
npm run dev          # Lokaler Test-Server
```

---

## Deployment mit GitHub Actions

### 1. Workflow aktivieren

Der Workflow ist im Template deaktiviert. Aktiviere ihn durch Umbenennen:

```bash
mv .github/workflows/deploy.yml.disabled .github/workflows/deploy.yml
```

### 2. Neues GitHub Repository

Erstelle ein neues Repository für dieses Model und pushe:

```bash
git init
git add -A
git commit -m "Initial setup"
git remote add origin https://github.com/DEIN-USER/model-domain-com.git
git branch -M main
git push -u origin main
```

### 3. GitHub Secrets einrichten

Gehe zu: `Repository → Settings → Secrets and variables → Actions`

Füge diese 4 Secrets hinzu:

| Secret | Wert |
|--------|------|
| `FTP_HOST` | `ftp.dein-server.com` |
| `FTP_USER` | `dein-ftp-user` |
| `FTP_PASSWORD` | `dein-ftp-passwort` |
| `FTP_DIR` | `/model-domain.com/` |

### 4. Fertig!

- **Täglich 7:00 Uhr**: Automatischer Build & Deploy
- **Bei jedem Push**: Automatischer Build & Deploy
- **Manuell**: Actions → "Build & Deploy" → "Run workflow"

---

## Projektstruktur

```
├── config/
│   ├── site.config.js          # Deine Config (gitignored)
│   └── site.config.example.js  # Template
├── data/                       # Auto-generiert
├── dist/                       # Build-Output
├── scripts/
│   ├── build.js
│   └── fetch-feed.js
├── src/
│   ├── assets/images/
│   ├── styles/
│   └── templates/
└── .github/workflows/
    └── deploy.yml.disabled  # Umbenennen zu deploy.yml zum Aktivieren
```

## Befehle

| Befehl | Beschreibung |
|--------|--------------|
| `npm run fetch-feed` | Videos & Profilbild laden |
| `npm run build` | Seite generieren |
| `npm run dev` | Lokaler Dev-Server |

---

## Anpassungen

### Farben
Bearbeite `theme` in `config/site.config.js`.

### Templates
Bearbeite EJS-Dateien in `src/templates/`.

### CSS
Bearbeite `src/styles/input.css` (Tailwind CSS).

---

## Schnellinstallation mit Claude Code

### 1. Repository klonen

```bash
git clone https://github.com/endcoreCL/model-page-generator.git ziel-domain.org
cd ziel-domain.org
```

### 2. Git-Historie löschen

```bash
rm -rf .git
```

### 3. Prompt für Claude Code

Kopiere folgenden Prompt und passe die Werte an:

```
Erstelle mir bitte eine neue Model-Seite. Hier findest du die Fakten.
Bitte richte alles korrekt ein. Bitte vor dem ersten Commit/Push warten,
ich möchte die Seite zunächst lokal validieren. Lese die README.md für
weitere Instruktionen.

MDH Profil: https://www.mydirtyhobby.de/profil/MODEL_ID-Model-Name
MyDirtyHobby ID: MODEL_ID
ATS: DEIN_ATS_TOKEN
ATC: cal-model-name
Zieldomain: model-domain.org

Tracking via Matomo
https://matomo.matchpanda.org
ID: MATOMO_ID

Versionierung
Git: https://github.com/endcoreCL/model-domain.org.git

Deployment workflow
FTP_HOST     ftp.server.com
FTP_USER     user@server.com
FTP_PASSWORD geheimes-passwort
FTP_DIR      /model-domain.org/

site.config.js bitte in das Git aufnehmen.
Deployment Workflow aktivieren und täglich um 3 Uhr Nachts starten.
```

### Beispiel (Emmi Hill)

```
Erstelle mir bitte eine neue Model-Seite. Hier findest du die Fakten.
Bitte richte alles korrekt ein. Bitte vor dem ersten Commit/Push warten,
ich möchte die Seite zunächst lokal validieren. Lese die README.md für
weitere Instruktionen.

MDH Profil: https://www.mydirtyhobby.de/profil/119287782-Emmi-Hill
MyDirtyHobby ID: 119287782
ATS: eyJhIjoyODQ4MTQsImMiOjQ5ODYzMzc3LCJuIjoyMSwicyI6MjQxLCJlIjo5NTQyLCJwIjoyfQ==
ATC: cal-emmi-hill
Zieldomain: emmi-hill.org

Tracking via Matomo
https://matomo.matchpanda.org
ID: 49

Versionierung
Git: https://github.com/endcoreCL/emmi-hill.org.git

Deployment workflow
FTP_HOST     ftp.defaultbitch.com
FTP_USER     chris@defaultbitch.com
FTP_PASSWORD ***siehe Bitwarden***
FTP_DIR      /emmi-hill.org/

site.config.js bitte in das Git aufnehmen.
Deployment Workflow aktivieren und täglich um 3 Uhr Nachts starten.
```

---

## Lizenz

Privat - Alle Rechte vorbehalten.
