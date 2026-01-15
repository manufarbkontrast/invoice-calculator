# 🚀 Deployment mit Hetzner Cloud Console Web-Terminal

## Keine SSH-Verbindung nötig! ✅

---

## Schritt 1: Web-Terminal öffnen

1. Gehe zu https://console.hetzner.cloud
2. Logge dich ein
3. Klicke auf deinen Server **"CX23 manuserver"**
4. Klicke auf den Tab **"Console"** oder **"Web Terminal"**
5. Du bist jetzt direkt auf dem Server! 🎉

---

## Schritt 2: Server vorbereiten

**Im Web-Terminal** (alle Befehle hier ausführen):

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx installieren
apt install -y nginx git

# pnpm installieren
npm install -g pnpm

# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
cd /var/www/invoice-calculator
```

---

## Schritt 3: Projekt hochladen

### Option A: Mit Git (empfohlen, wenn Projekt in Git-Repo)

```bash
cd /var/www/invoice-calculator
git clone <dein-repo-url> .
```

### Option B: Dateien manuell erstellen

Falls kein Git-Repo vorhanden, erstelle die wichtigsten Dateien manuell oder kopiere sie:

```bash
# Erstelle Projekt-Struktur
mkdir -p client/src server/_core shared deployment

# Kopiere wichtige Dateien (siehe unten)
```

### Option C: Mit wget/curl (wenn Projekt online verfügbar)

```bash
# Falls Projekt als ZIP online verfügbar ist
wget https://example.com/invoice-calculator.zip
unzip invoice-calculator.zip -d /var/www/invoice-calculator
```

---

## Schritt 4: Projekt einrichten

**Im Web-Terminal:**

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
```

**In nano (.env-Datei):**
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_calculator
JWT_SECRET=dein-sehr-langer-und-sicherer-secret-key
SUPABASE_URL=https://dein-projekt.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
VITE_SUPABASE_URL=https://dein-projekt.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key
```

**Speichern:** `Ctrl+O`, dann `Enter`, dann `Ctrl+X`

```bash
# Projekt bauen
pnpm run build
```

---

## Schritt 5: Service einrichten

**Im Web-Terminal:**

```bash
cd /var/www/invoice-calculator

# Service-Datei erstellen
nano /etc/systemd/system/invoice-calculator.service
```

**In nano (Service-Datei):**
```
[Unit]
Description=Invoice Calculator Node.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/invoice-calculator
EnvironmentFile=/var/www/invoice-calculator/.env
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/node /var/www/invoice-calculator/dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=invoice-calculator

[Install]
WantedBy=multi-user.target
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Service aktivieren
systemctl daemon-reload
systemctl enable invoice-calculator
systemctl start invoice-calculator

# Status prüfen
systemctl status invoice-calculator
```

---

## Schritt 6: Nginx konfigurieren

**Im Web-Terminal:**

```bash
# Nginx-Konfiguration erstellen
nano /etc/nginx/sites-available/invoice-calculator
```

**In nano (Nginx-Konfiguration):**
```
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 50M;
}
```

**WICHTIG:** Ersetze `deine-domain.de` mit deiner tatsächlichen Domain!

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

## Schritt 7: Firewall einrichten

**Im Web-Terminal:**

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
# Bestätige mit 'y'
```

---

## Schritt 8: DNS konfigurieren

**Bei deinem Domain-Provider** (im Browser):

- **Typ:** A-Record
- **Name:** @ (oder Subdomain)
- **Wert:** `91.99.211.1`

Warte 5-15 Minuten.

---

## Schritt 9: SSL einrichten (optional, empfohlen)

**Im Web-Terminal:**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d invoice.crftn.de -d www.invoice.crftn.de
```

---

## ✅ Fertig!

Deine Anwendung sollte jetzt unter deiner Domain erreichbar sein!

---

## 🔍 Hilfe

### Service prüfen
```bash
systemctl status invoice-calculator
journalctl -u invoice-calculator -f
```

### Nginx prüfen
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Logs ansehen
```bash
journalctl -u invoice-calculator -n 50
```

---

## 💡 Tipp: Projekt-Dateien hochladen

Falls du die Projekt-Dateien vom Mac hochladen musst:

1. **Erstelle ein ZIP-Archiv auf dem Mac:**
```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
zip -r invoice-calculator.zip . -x "node_modules/*" ".git/*" "dist/*"
```

2. **Lade es auf einen File-Hoster hoch** (z.B. Dropbox, Google Drive, etc.)

3. **Lade es auf dem Server herunter:**
```bash
# Im Web-Terminal:
cd /var/www
wget https://example.com/invoice-calculator.zip
unzip invoice-calculator.zip -d invoice-calculator
cd invoice-calculator
```

Oder verwende **Git** (einfachste Methode)!
