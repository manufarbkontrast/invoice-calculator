# 📤 Projekt auf Server laden - Alle Methoden

## 🎯 Schnellübersicht

Es gibt mehrere Wege, dein Projekt auf den Server zu laden. Wähle die für dich einfachste Methode:

1. **✅ Mit rsync (empfohlen, wenn SSH funktioniert)**
2. **✅ Mit Hetzner Web-Terminal + Git (einfachste Methode)**
3. **✅ Mit Hetzner Web-Terminal + ZIP-Datei**
4. **✅ Mit rsync + Passwort (falls SSH-Key nicht funktioniert)**

---

## 🚀 Methode 1: Mit rsync (SSH-Key erforderlich)

**Vorteile:** Schnell, automatisch, synchronisiert nur geänderte Dateien

### Voraussetzung:
- SSH-Key muss eingerichtet sein (siehe `SSH-VERBINDUNG.md`)

### Auf deinem Mac im Terminal:

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Verwende das vorhandene Skript
bash deployment/upload-to-server.sh
```

**Oder manuell:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Projekt hochladen (ohne node_modules, .git, dist)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

**Was wird hochgeladen:**
- ✅ Alle Quellcode-Dateien
- ✅ package.json, pnpm-lock.yaml
- ✅ deployment/ Ordner
- ❌ node_modules (wird auf Server installiert)
- ❌ .git (nicht nötig)
- ❌ dist (wird auf Server gebaut)
- ❌ .env (wird auf Server erstellt)

---

## 🚀 Methode 2: Mit Hetzner Web-Terminal + Git (EMPFOHLEN)

**Vorteile:** Keine SSH-Konfiguration nötig, sehr einfach

### Schritt 1: Projekt in Git-Repo hochladen (falls noch nicht geschehen)

**Auf deinem Mac:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Falls noch kein Git-Repo:
git init
git add .
git commit -m "Initial commit"

# Erstelle ein Repository auf GitHub/GitLab/Bitbucket
# Dann:
git remote add origin <dein-repo-url>
git push -u origin main
```

### Schritt 2: Auf Server mit Git klonen

1. **Gehe zu:** https://console.hetzner.cloud
2. **Wähle deinen Server**
3. **Klicke auf "Console" oder "Web Terminal"**
4. **Führe aus:**

```bash
# Server vorbereiten (falls noch nicht geschehen)
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pnpm

# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
cd /var/www/invoice-calculator

# Projekt klonen
git clone <dein-repo-url> .

# Dependencies installieren
pnpm install
```

**Fertig!** ✅

---

## 🚀 Methode 3: Mit Hetzner Web-Terminal + ZIP-Datei

**Vorteile:** Keine SSH-Konfiguration, keine Git-Kenntnisse nötig

### Schritt 1: ZIP-Archiv erstellen (auf deinem Mac)

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# ZIP erstellen (ohne node_modules, .git, dist)
zip -r invoice-calculator.zip . \
  -x "node_modules/*" \
  -x ".git/*" \
  -x "dist/*" \
  -x "*.log" \
  -x ".DS_Store"
```

### Schritt 2: ZIP-Datei hochladen

**Option A: Mit File-Hoster (Dropbox, Google Drive, etc.)**

1. Lade `invoice-calculator.zip` auf einen File-Hoster hoch
2. Erhalte einen Download-Link (öffentlich oder mit Token)

**Option B: Mit Hetzner Cloud Console**

1. Gehe zu https://console.hetzner.cloud
2. Wähle deinen Server
3. Klicke auf "Console" oder "Web Terminal"
4. Klicke auf "Upload" (falls verfügbar) und lade die ZIP-Datei hoch

### Schritt 3: Auf Server entpacken

**Im Hetzner Web-Terminal:**

```bash
# Server vorbereiten (falls noch nicht geschehen)
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git unzip
npm install -g pnpm

# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
cd /var/www/invoice-calculator

# ZIP-Datei herunterladen (wenn auf File-Hoster)
wget https://example.com/invoice-calculator.zip

# Oder wenn bereits hochgeladen:
# Die ZIP-Datei sollte im Home-Verzeichnis sein
mv ~/invoice-calculator.zip .

# Entpacken
unzip invoice-calculator.zip -d .

# Dependencies installieren
pnpm install
```

**Fertig!** ✅

---

## 🚀 Methode 4: Mit rsync + Passwort (ohne SSH-Key)

**Vorteile:** Funktioniert auch ohne SSH-Key-Setup

### Voraussetzung:
- `expect` muss installiert sein: `brew install expect`

### Auf deinem Mac:

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Verwende das Passwort-Skript
bash deployment/upload-with-password.sh
```

**Oder manuell mit Passwort-Eingabe:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# rsync mit Passwort (wird nach Passwort gefragt)
rsync -avz --progress \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'dist' \
  --exclude '.env' \
  --exclude '*.log' \
  --exclude '.DS_Store' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/

# Passwort: jNATjTEHJPaP
```

---

## ✅ Nach dem Upload: Projekt auf Server einrichten

**Egal welche Methode du verwendet hast, führe danach diese Schritte aus:**

### 1. Verbinde dich mit dem Server

**Option A: Hetzner Web-Terminal**
- Gehe zu https://console.hetzner.cloud
- Wähle Server → Console

**Option B: SSH**
```bash
ssh root@91.99.211.1
```

### 2. Projekt einrichten

```bash
cd /var/www/invoice-calculator

# Dependencies installieren (falls noch nicht geschehen)
pnpm install

# .env-Datei erstellen
nano .env
```

**Füge in .env ein:**
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_calculator
JWT_SECRET=dein-sehr-langer-und-sicherer-secret-key
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Projekt bauen
pnpm run build

# Service einrichten
cp deployment/invoice-calculator.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable invoice-calculator
systemctl start invoice-calculator

# Status prüfen
systemctl status invoice-calculator
```

---

## 🔍 Troubleshooting

### "Permission denied" bei rsync

**Lösung:** Prüfe SSH-Key-Setup (siehe `SSH-VERBINDUNG.md`)

### "Connection refused" oder "Connection timeout"

**Lösung:** 
- Prüfe, ob Server erreichbar ist: `ping 91.99.211.1`
- Prüfe Firewall-Einstellungen in Hetzner Cloud Console

### "rsync: command not found"

**Lösung:**
```bash
brew install rsync
```

### "expect: command not found"

**Lösung:**
```bash
brew install expect
```

### Upload dauert sehr lange

**Normal!** Je nach Internet-Geschwindigkeit kann der Upload 5-30 Minuten dauern.

**Tipp:** Verwende Git (Methode 2) - das ist viel schneller!

---

## 📊 Vergleich der Methoden

| Methode | Geschwindigkeit | Einfachheit | Voraussetzungen |
|---------|----------------|-------------|-----------------|
| **Git** | ⚡⚡⚡ Sehr schnell | ⭐⭐⭐ Sehr einfach | Git-Repo |
| **rsync (SSH-Key)** | ⚡⚡ Schnell | ⭐⭐ Mittel | SSH-Key |
| **rsync (Passwort)** | ⚡⚡ Schnell | ⭐⭐ Mittel | expect |
| **ZIP-Datei** | ⚡ Langsam | ⭐⭐⭐ Sehr einfach | Keine |

**Empfehlung:** Verwende **Git (Methode 2)** - am einfachsten und schnellsten!

---

## 🎯 Schnellstart: Welche Methode für dich?

- **✅ Ich habe ein Git-Repo** → Methode 2 (Git)
- **✅ SSH-Key ist eingerichtet** → Methode 1 (rsync)
- **✅ Ich möchte es einfach haben** → Methode 2 (Git) oder Methode 3 (ZIP)
- **✅ SSH funktioniert mit Passwort** → Methode 4 (rsync + Passwort)

---

## 📚 Weitere Hilfe

- `deployment/SSH-VERBINDUNG.md` - SSH-Key einrichten
- `deployment/MANUELL-DEPLOYMENT.md` - Vollständige Deployment-Anleitung
- `deployment/DOMAIN-ONLINE-SCHALTEN.md` - Domain konfigurieren
