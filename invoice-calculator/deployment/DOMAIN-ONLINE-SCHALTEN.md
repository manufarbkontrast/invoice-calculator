# 🌐 Website mit Domain online schalten - Komplette Anleitung

## 📋 Übersicht

Diese Anleitung führt dich Schritt für Schritt durch das Online-Schalten deiner Website mit deiner Domain.

**Server-IP:** `91.99.211.1`  
**Server:** Hetzner Cloud

---

## ✅ Schritt 1: DNS-Konfiguration bei deinem Domain-Provider

### Was du brauchst:
- Zugang zu deinem Domain-Provider (z.B. IONOS, Strato, GoDaddy, etc.)
- Deine Domain (z.B. `meine-domain.de`)

### Was du tun musst:

1. **Logge dich bei deinem Domain-Provider ein**
2. **Gehe zur DNS-Verwaltung** (oft unter "DNS", "DNS-Einstellungen", "Zoneneinträge")
3. **Füge einen A-Record hinzu:**
   - **Typ:** `A` (oder `A-Record`)
   - **Name/Hostname:** 
     - `@` oder leer lassen = Hauptdomain (z.B. `meine-domain.de`)
     - Oder eine Subdomain wie `invoice` = `invoice.meine-domain.de`
   - **Wert/IP-Adresse:** `91.99.211.1`
   - **TTL:** `3600` (oder Standard)

4. **Optional: www-Subdomain hinzufügen**
   - **Typ:** `A`
   - **Name:** `www`
   - **Wert:** `91.99.211.1`
   - Oder: **Typ:** `CNAME`, **Name:** `www`, **Wert:** `meine-domain.de`

5. **Speichern** und warten (5-15 Minuten für DNS-Propagierung)

### DNS prüfen:
```bash
# Auf deinem Mac im Terminal:
nslookup deine-domain.de
# oder
dig deine-domain.de

# Sollte zeigen: 91.99.211.1
```

---

## ✅ Schritt 2: Server vorbereiten

### Option A: Mit Hetzner Cloud Console Web-Terminal (EMPFOHLEN)

1. **Gehe zu:** https://console.hetzner.cloud
2. **Wähle deinen Server** (91.99.211.1)
3. **Klicke auf "Console" oder "Web Terminal"**
4. **Führe diese Befehle aus:**

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

### Option B: Mit SSH (falls eingerichtet)

```bash
# Auf deinem Mac:
ssh root@91.99.211.1
# Dann die gleichen Befehle wie oben
```

---

## ✅ Schritt 3: Projekt auf Server hochladen

### Option 1: Mit rsync (vom Mac)

**Auf deinem Mac im Terminal:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Projekt hochladen (ohne node_modules, .git, dist)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

**Wenn nach Passwort gefragt wird:** `jNATjTEHJPaP`

### Option 2: Mit Git (wenn Projekt in Git-Repo)

**Auf dem Server** (im Web-Terminal):

```bash
cd /var/www/invoice-calculator
git clone <dein-repo-url> .
```

### Option 3: Mit scp (Alternative)

**Auf deinem Mac:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
scp -r . root@91.99.211.1:/var/www/invoice-calculator/
```

---

## ✅ Schritt 4: Projekt auf Server einrichten

**Auf dem Server** (im Web-Terminal oder per SSH):

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
```

**Füge in die .env-Datei ein** (passe die Werte an):

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

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Projekt bauen
pnpm run build
```

---

## ✅ Schritt 5: Systemd-Service einrichten

**Auf dem Server:**

```bash
cd /var/www/invoice-calculator

# Service-Datei kopieren
cp deployment/invoice-calculator.service /etc/systemd/system/

# Service aktivieren
systemctl daemon-reload
systemctl enable invoice-calculator
systemctl start invoice-calculator

# Status prüfen
systemctl status invoice-calculator
```

**Falls der Service nicht startet:**
```bash
# Logs ansehen
journalctl -u invoice-calculator -n 50
```

---

## ✅ Schritt 6: Nginx konfigurieren

**Auf dem Server:**

```bash
cd /var/www/invoice-calculator

# Nginx-Konfiguration kopieren
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Domain in Nginx-Konfiguration anpassen
nano /etc/nginx/sites-available/invoice-calculator
```

**Ersetze in der Datei:**
```
server_name invoice.crftn.de www.invoice.crftn.de;
```

**Mit deiner Domain:**
```
server_name deine-domain.de www.deine-domain.de;
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Nginx-Konfiguration aktivieren
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Konfiguration testen
nginx -t

# Nginx neu starten
systemctl restart nginx

# Status prüfen
systemctl status nginx
```

---

## ✅ Schritt 7: Firewall einrichten

**Auf dem Server:**

```bash
# Firewall-Regeln hinzufügen
ufw allow ssh
ufw allow 'Nginx Full'

# Firewall aktivieren
ufw enable
# Bestätige mit 'y'
```

---

## ✅ Schritt 8: SSL-Zertifikat einrichten (HTTPS)

**WICHTIG:** Warte 5-15 Minuten nach DNS-Konfiguration, bevor du SSL einrichtest!

**Auf dem Server:**

```bash
# Certbot installieren
apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen (ersetze mit deiner Domain!)
certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

**Certbot wird dich fragen:**
- E-Mail-Adresse (für Benachrichtigungen)
- Zustimmung zu den AGBs
- Weiterleitung von HTTP zu HTTPS (empfohlen: Option 2)

**Automatische Erneuerung testen:**
```bash
certbot renew --dry-run
```

---

## ✅ Schritt 9: Alles testen

### 1. DNS prüfen:
```bash
# Auf deinem Mac:
nslookup deine-domain.de
# Sollte zeigen: 91.99.211.1
```

### 2. Service prüfen:
```bash
# Auf dem Server:
systemctl status invoice-calculator
```

### 3. Nginx prüfen:
```bash
# Auf dem Server:
nginx -t
systemctl status nginx
```

### 4. Website im Browser öffnen:
- **HTTP:** http://deine-domain.de
- **HTTPS:** https://deine-domain.de (nach SSL-Setup)

---

## 🎉 Fertig!

Deine Website sollte jetzt online sein!

**Erreichbar unter:**
- 🌐 http://deine-domain.de
- 🔒 https://deine-domain.de

---

## 🔍 Troubleshooting

### Website lädt nicht

1. **DNS prüfen:**
   ```bash
   nslookup deine-domain.de
   ```

2. **Service prüfen:**
   ```bash
   systemctl status invoice-calculator
   journalctl -u invoice-calculator -f
   ```

3. **Nginx prüfen:**
   ```bash
   nginx -t
   tail -f /var/log/nginx/error.log
   ```

4. **Port prüfen:**
   ```bash
   lsof -i :3000
   curl http://localhost:3000
   ```

### SSL funktioniert nicht

```bash
# Zertifikat prüfen
certbot certificates

# Zertifikat erneuern
certbot renew

# Nginx neu starten
systemctl restart nginx
```

### 502 Bad Gateway

- Prüfe, ob der Service läuft: `systemctl status invoice-calculator`
- Prüfe die Logs: `journalctl -u invoice-calculator -n 50`
- Prüfe, ob Port 3000 erreichbar ist: `curl http://localhost:3000`

### Domain zeigt noch alte Seite

- DNS-Cache leeren (warten 5-15 Minuten)
- Browser-Cache leeren (Strg+Shift+R oder Cmd+Shift+R)
- Prüfe, ob die richtige Domain in Nginx konfiguriert ist

---

## 📚 Weitere Hilfe

- `deployment/MANUELL-DEPLOYMENT.md` - Detaillierte Deployment-Anleitung
- `deployment/DNS-SETUP.md` - DNS-Konfiguration Details
- `deployment/SSH-VERBINDUNG.md` - SSH-Setup
- `deployment/NEXT-STEPS.md` - Weitere Schritte

---

## 📝 Checkliste

- [ ] DNS A-Record bei Domain-Provider hinzugefügt
- [ ] DNS-Propagierung geprüft (nslookup)
- [ ] Server vorbereitet (Node.js, Nginx, pnpm)
- [ ] Projekt auf Server hochgeladen
- [ ] .env-Datei erstellt und konfiguriert
- [ ] Projekt gebaut (pnpm run build)
- [ ] Systemd-Service eingerichtet und gestartet
- [ ] Nginx konfiguriert (Domain angepasst)
- [ ] Firewall eingerichtet
- [ ] SSL-Zertifikat installiert (optional)
- [ ] Website im Browser getestet
