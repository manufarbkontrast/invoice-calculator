# 🚀 Schnellstart-Anleitung für deinen Hetzner-Server

## Deine Server-Daten
- **Server-Name:** CX23 manuserver
- **IPv4:** 91.99.211.1
- **Standort:** Falkenstein, Deutschland
- **Server-ID:** #113058805

---

## Schritt 1: SSH-Verbindung zum Server herstellen

Öffne ein Terminal auf deinem lokalen Rechner und verbinde dich mit dem Server:

```bash
ssh root@91.99.211.1
```

**Hinweis:** Falls du einen anderen Benutzer oder SSH-Key verwendest, passe den Befehl entsprechend an.

---

## Schritt 2: System aktualisieren und Basis-Software installieren

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js installieren (Version 20)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx installieren
apt install -y nginx

# Git installieren (falls noch nicht vorhanden)
apt install -y git

# pnpm installieren (Package Manager)
npm install -g pnpm

# Prüfen, ob alles installiert ist
node --version
npm --version
pnpm --version
nginx -v
```

---

## Schritt 3: Projekt-Verzeichnis erstellen

```bash
# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
cd /var/www/invoice-calculator
```

---

## Schritt 4: Projekt hochladen

Du hast mehrere Optionen:

### Option A: Mit Git (empfohlen, wenn Projekt in Git-Repo ist)
```bash
# Falls du ein Git-Repository hast:
git clone <dein-repo-url> /var/www/invoice-calculator
cd /var/www/invoice-calculator
```

### Option B: Mit rsync vom lokalen Rechner
Auf deinem **lokalen Rechner** (nicht auf dem Server) ausführen:

```bash
# Stelle sicher, dass du im Projekt-Verzeichnis bist
cd /Users/craftongmbh/Downloads/invoice-calculator

# Projekt auf Server hochladen (ersetzt USERNAME mit deinem SSH-User, meist 'root')
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

### Option C: Mit scp (einfach, aber langsamer)
Auf deinem **lokalen Rechner**:

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
scp -r . root@91.99.211.1:/var/www/invoice-calculator/
```

---

## Schritt 5: Dependencies installieren und Projekt bauen

**Auf dem Server:**

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
```

**In der .env-Datei folgende Werte eintragen:**
```env
NODE_ENV=production
PORT=3000

# Datenbank (wenn vorhanden)
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_calculator

# JWT Secret (generiere einen sicheren String)
JWT_SECRET=dein-sehr-langer-und-sicherer-secret-key-hier

# Supabase (wenn verwendet)
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Weitere Variablen nach Bedarf...
```

**Speichern:** `Ctrl+O`, dann `Enter`, dann `Ctrl+X`

```bash
# Projekt bauen
pnpm run build
```

---

## Schritt 6: Systemd Service einrichten

```bash
# Service-Datei kopieren
cp deployment/invoice-calculator.service /etc/systemd/system/

# Service-Datei anpassen (falls nötig)
nano /etc/systemd/system/invoice-calculator.service
# Stelle sicher, dass der Pfad /var/www/invoice-calculator ist

# Service aktivieren und starten
systemctl daemon-reload
systemctl enable invoice-calculator
systemctl start invoice-calculator

# Status prüfen
systemctl status invoice-calculator
```

**Tipp:** Falls der Service nicht startet, prüfe die Logs:
```bash
journalctl -u invoice-calculator -f
```

---

## Schritt 7: Nginx konfigurieren

```bash
# Nginx-Konfiguration kopieren
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Domain in Konfiguration anpassen
nano /etc/nginx/sites-available/invoice-calculator
```

**Wichtig:** Ersetze `deine-domain.de` mit deiner tatsächlichen Domain!

```bash
# Symlink erstellen
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/

# Standard-Nginx-Konfiguration entfernen (falls vorhanden)
rm -f /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
nginx -t

# Nginx starten/neu starten
systemctl restart nginx
systemctl status nginx
```

---

## Schritt 8: Domain-DNS konfigurieren

Gehe zu deinem Domain-Provider (z.B. Namecheap, GoDaddy, etc.) und erstelle einen **A-Record**:

- **Typ:** A
- **Name:** @ (oder deine Subdomain wie `invoice`)
- **Wert:** `91.99.211.1`
- **TTL:** 3600 (oder automatisch)

**Beispiel:**
- Domain: `example.com` → A-Record: `@` → `91.99.211.1`
- Oder Subdomain: `invoice.example.com` → A-Record: `invoice` → `91.99.211.1`

**Warte 5-15 Minuten**, bis die DNS-Änderungen wirksam werden.

---

## Schritt 9: SSL-Zertifikat einrichten (HTTPS)

```bash
# Certbot installieren
apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen (ersetze mit deiner Domain!)
certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Automatische Erneuerung testen
certbot renew --dry-run
```

**Hinweis:** Certbot passt automatisch die Nginx-Konfiguration an, um HTTPS zu aktivieren.

---

## Schritt 10: Firewall konfigurieren

```bash
# UFW Firewall installieren (falls nicht vorhanden)
apt install -y ufw

# SSH erlauben (WICHTIG - sonst verlierst du Zugriff!)
ufw allow ssh
ufw allow 'Nginx Full'  # Erlaubt HTTP (80) und HTTPS (443)

# Firewall aktivieren
ufw enable

# Status prüfen
ufw status
```

**Wichtig:** Port 3000 sollte NICHT öffentlich erreichbar sein - nur über Nginx von localhost!

---

## ✅ Fertig!

Deine Anwendung sollte jetzt unter `http://deine-domain.de` (oder nach SSL-Setup unter `https://deine-domain.de`) erreichbar sein!

---

## 🔍 Troubleshooting

### Service startet nicht
```bash
# Logs ansehen
journalctl -u invoice-calculator -n 50

# Service manuell testen
cd /var/www/invoice-calculator
NODE_ENV=production node dist/index.js
```

### Nginx-Fehler
```bash
# Konfiguration testen
nginx -t

# Logs prüfen
tail -f /var/log/nginx/error.log
```

### Port bereits belegt
```bash
# Prüfen, welcher Prozess Port 3000 verwendet
lsof -i :3000
# Oder
netstat -tulpn | grep 3000
```

### Domain funktioniert nicht
```bash
# DNS prüfen
nslookup deine-domain.de
dig deine-domain.de

# Prüfen, ob Nginx läuft
systemctl status nginx
```

---

## 📝 Nützliche Befehle

```bash
# Service neu starten
systemctl restart invoice-calculator

# Nginx neu starten
systemctl restart nginx

# Logs live ansehen
journalctl -u invoice-calculator -f

# Projekt aktualisieren
cd /var/www/invoice-calculator
git pull  # oder rsync vom lokalen Rechner
pnpm install
pnpm run build
systemctl restart invoice-calculator
```

---

## 🎯 Nächste Schritte

1. ✅ Domain-DNS konfigurieren
2. ✅ SSL-Zertifikat einrichten
3. ✅ Firewall konfigurieren
4. ✅ Projekt testen
5. ✅ Backups einrichten (optional, aber empfohlen!)

Viel Erfolg! 🚀
