# ✅ DNS konfiguriert - Nächste Schritte

## ✅ Was bereits erledigt ist:

- ✅ DNS A-Record hinzugefügt: `invoice.crftn.de` → `91.99.211.1`
- ✅ Nginx-Konfiguration vorbereitet
- ✅ Alle Skripte aktualisiert

---

## 🚀 Jetzt: Server-Setup durchführen

### Option 1: Mit Hetzner Cloud Console Web-Terminal (EMPFOHLEN)

1. **Gehe zu:** https://console.hetzner.cloud
2. **Wähle deinen Server**
3. **Klicke auf "Console" oder "Web Terminal"**
4. **Führe diese Befehle aus:**

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

### Option 2: Mit SSH (falls funktioniert)

```bash
ssh root@91.99.211.1
# Dann die gleichen Befehle wie oben
```

---

## 📤 Projekt hochladen

### Mit Git (wenn Projekt in Git-Repo):

```bash
# Im Web-Terminal auf dem Server:
cd /var/www/invoice-calculator
git clone <dein-repo-url> .
```

### Oder: Projekt vom Mac hochladen

**Auf deinem Mac:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

---

## ⚙️ Projekt einrichten

**Auf dem Server** (im Web-Terminal):

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
```

**Füge in .env ein:**
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

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Projekt bauen
pnpm run build
```

---

## 🔧 Service einrichten

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

---

## 🌐 Nginx konfigurieren

**Auf dem Server:**

```bash
cd /var/www/invoice-calculator

# Nginx-Konfiguration kopieren (ist bereits für invoice.crftn.de konfiguriert!)
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Aktivieren
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testen
nginx -t

# Starten
systemctl restart nginx
```

---

## 🔥 Firewall einrichten

**Auf dem Server:**

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
# Bestätige mit 'y'
```

---

## 🔒 SSL einrichten (optional, empfohlen)

**Auf dem Server:**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d invoice.crftn.de -d www.invoice.crftn.de
```

---

## ✅ Fertig!

Nach 5-15 Minuten (DNS-Propagierung) sollte deine Anwendung erreichbar sein:

- 🌐 **HTTP:** http://invoice.crftn.de
- 🔒 **HTTPS:** https://invoice.crftn.de (nach SSL-Setup)

---

## 🔍 Prüfen

### DNS prüfen:
```bash
# Auf deinem Mac:
nslookup invoice.crftn.de
# Sollte zeigen: 91.99.211.1
```

### Service prüfen:
```bash
# Auf dem Server:
systemctl status invoice-calculator
journalctl -u invoice-calculator -f
```

### Nginx prüfen:
```bash
# Auf dem Server:
nginx -t
tail -f /var/log/nginx/error.log
```

---

## 📚 Weitere Hilfe

- `deployment/DEPLOYMENT-MIT-WEB-TERMINAL.md` - Vollständige Anleitung
- `deployment/DNS-SETUP.md` - DNS-Details
- `deployment/SERVER-INFO.md` - Server-Informationen
