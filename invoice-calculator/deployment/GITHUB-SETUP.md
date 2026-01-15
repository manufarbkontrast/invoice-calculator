# 🚀 GitHub-Repository erstellen und Projekt hochladen

## ✅ Was bereits erledigt ist:

- ✅ Git-Repository initialisiert
- ✅ Alle Dateien hinzugefügt
- ✅ Erster Commit erstellt

---

## 📝 Schritt 1: GitHub-Repository erstellen

### Option A: Über GitHub Website (empfohlen)

1. **Gehe zu:** https://github.com/new
2. **Repository-Name:** z.B. `invoice-calculator` (oder einen anderen Namen)
3. **Beschreibung:** (optional) z.B. "Invoice Calculator Web Application"
4. **Sichtbarkeit:**
   - ✅ **Private** (empfohlen, wenn Code nicht öffentlich sein soll)
   - Oder **Public** (wenn Code öffentlich sein soll)
5. **WICHTIG:** ❌ **NICHT** "Initialize this repository with a README" ankreuzen!
6. **Klicke auf "Create repository"**

### Option B: Mit GitHub CLI (falls installiert)

```bash
gh repo create invoice-calculator --private --source=. --remote=origin --push
```

---

## 📤 Schritt 2: Projekt zu GitHub hochladen

**Auf deinem Mac im Terminal:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# GitHub-Repository als Remote hinzufügen
# ERSETZE <dein-username> und <repo-name> mit deinen Werten!
git remote add origin https://github.com/<dein-username>/<repo-name>.git

# Beispiel:
# git remote add origin https://github.com/craftongmbh/invoice-calculator.git

# Branch auf 'main' umbenennen (falls nötig)
git branch -M main

# Projekt hochladen
git push -u origin main
```

**Wenn nach Benutzername/Passwort gefragt wird:**
- **Benutzername:** Dein GitHub-Benutzername
- **Passwort:** Verwende ein **Personal Access Token** (nicht dein GitHub-Passwort!)

### Personal Access Token erstellen:

1. Gehe zu: https://github.com/settings/tokens
2. Klicke auf "Generate new token" → "Generate new token (classic)"
3. **Name:** z.B. "Invoice Calculator Deployment"
4. **Ablauf:** Wähle eine Dauer (z.B. 90 Tage)
5. **Berechtigungen:** Aktiviere `repo` (vollständiger Zugriff auf private Repositories)
6. **Klicke auf "Generate token"**
7. **Kopiere den Token** (wird nur einmal angezeigt!)
8. Verwende diesen Token als Passwort beim `git push`

---

## ✅ Schritt 3: Prüfen

Gehe zu deinem GitHub-Repository und prüfe, ob alle Dateien hochgeladen wurden:
- https://github.com/<dein-username>/<repo-name>

---

## 🎯 Schritt 4: Projekt auf Server deployen

Jetzt kannst du das Projekt auf deinem Server deployen!

### Im Hetzner Cloud Console Web-Terminal:

1. **Gehe zu:** https://console.hetzner.cloud
2. **Wähle deinen Server** (91.99.211.1)
3. **Klicke auf "Console" oder "Web Terminal"**

### Server vorbereiten (falls noch nicht geschehen):

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx und Git installieren
apt install -y nginx git

# pnpm installieren
npm install -g pnpm

# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
cd /var/www/invoice-calculator
```

### Projekt klonen:

```bash
cd /var/www/invoice-calculator

# Projekt von GitHub klonen
# ERSETZE <dein-username> und <repo-name>!
git clone https://github.com/<dein-username>/<repo-name>.git .

# Beispiel:
# git clone https://github.com/craftongmbh/invoice-calculator.git .
```

**Wenn nach Authentifizierung gefragt wird:**
- Verwende dein **Personal Access Token** als Passwort

**Oder:** Verwende SSH-Key (siehe unten)

---

## ⚙️ Schritt 5: Projekt auf Server einrichten

**Im Hetzner Web-Terminal:**

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
```

**Füge in .env ein** (passe die Werte an):

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_calculator
JWT_SECRET=dein-sehr-langer-und-sicherer-secret-key-hier
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

**Speichern:** `Ctrl+O`, dann `Enter`, dann `Ctrl+X`

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

## 🌐 Schritt 6: Nginx konfigurieren

**Im Hetzner Web-Terminal:**

```bash
cd /var/www/invoice-calculator

# Nginx-Konfiguration kopieren
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Domain in Nginx-Konfiguration anpassen
nano /etc/nginx/sites-available/invoice-calculator
```

**Ersetze:**
```
server_name invoice.crftn.de www.invoice.crftn.de;
```

**Mit deiner Domain:**
```
server_name deine-domain.de www.deine-domain.de;
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Aktivieren
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testen
nginx -t

# Starten
systemctl restart nginx
```

---

## 🔒 Schritt 7: SSL einrichten (optional, empfohlen)

**Warte 5-15 Minuten nach DNS-Konfiguration!**

**Im Hetzner Web-Terminal:**

```bash
# Certbot installieren
apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen (ersetze mit deiner Domain!)
certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

---

## 🔄 Zukünftige Updates

Wenn du Änderungen am Projekt machst:

**Auf deinem Mac:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Änderungen hinzufügen
git add .

# Commit erstellen
git commit -m "Beschreibung der Änderungen"

# Zu GitHub hochladen
git push
```

**Auf dem Server:**

```bash
cd /var/www/invoice-calculator

# Neueste Version holen
git pull

# Dependencies aktualisieren (falls package.json geändert wurde)
pnpm install

# Projekt neu bauen
pnpm run build

# Service neu starten
systemctl restart invoice-calculator
```

---

## 🔐 Optional: SSH-Key für GitHub einrichten

Damit du auf dem Server ohne Passwort klonen kannst:

### 1. SSH-Key auf Server erstellen:

```bash
# Im Hetzner Web-Terminal:
ssh-keygen -t ed25519 -C "server@invoice-calculator"
# Enter drücken für alle Fragen (Standard-Werte verwenden)
```

### 2. Öffentlichen Key anzeigen:

```bash
cat ~/.ssh/id_ed25519.pub
```

### 3. Key zu GitHub hinzufügen:

1. Gehe zu: https://github.com/settings/keys
2. Klicke auf "New SSH key"
3. **Title:** z.B. "Hetzner Server"
4. **Key:** Füge den Inhalt von `cat ~/.ssh/id_ed25519.pub` ein
5. Klicke auf "Add SSH key"

### 4. Mit SSH klonen:

```bash
# Auf dem Server:
git clone git@github.com:<dein-username>/<repo-name>.git /var/www/invoice-calculator
```

---

## 📋 Checkliste

- [ ] GitHub-Repository erstellt
- [ ] Projekt zu GitHub hochgeladen (`git push`)
- [ ] Server vorbereitet (Node.js, Nginx, pnpm)
- [ ] Projekt auf Server geklont (`git clone`)
- [ ] Dependencies installiert (`pnpm install`)
- [ ] .env-Datei erstellt
- [ ] Projekt gebaut (`pnpm run build`)
- [ ] Systemd-Service eingerichtet
- [ ] Nginx konfiguriert (Domain angepasst)
- [ ] DNS konfiguriert (A-Record)
- [ ] SSL-Zertifikat installiert (optional)
- [ ] Website getestet

---

## 🆘 Hilfe bei Problemen

### "Permission denied" beim git push

- Prüfe, ob du ein Personal Access Token verwendest (nicht dein Passwort)
- Prüfe, ob der Token die `repo`-Berechtigung hat

### "Repository not found"

- Prüfe, ob der Repository-Name korrekt ist
- Prüfe, ob das Repository existiert und du Zugriff hast

### "Authentication failed" auf Server

- Verwende Personal Access Token
- Oder richte SSH-Key ein (siehe oben)

---

## 📚 Weitere Dokumentation

- `deployment/DOMAIN-ONLINE-SCHALTEN.md` - Domain konfigurieren
- `deployment/MANUELL-DEPLOYMENT.md` - Vollständige Deployment-Anleitung
- `deployment/PROJEKT-AUF-SERVER-LADEN.md` - Weitere Upload-Methoden
