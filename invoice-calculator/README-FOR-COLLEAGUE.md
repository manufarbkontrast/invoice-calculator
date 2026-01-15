# 📦 Invoice Calculator - Deployment-Paket

## Für den Kollegen: Was ist hier drin?

Dieses Paket enthält das **invoice-calculator** Projekt mit allen Deployment-Anleitungen.

---

## 🚀 Schnellstart für Deployment

### Server-Informationen
- **Server-IP:** `91.99.211.1`
- **Domain:** `invoice.crftn.de`
- **DNS:** ✅ Bereits konfiguriert (A-Record → 91.99.211.1)
- **SSH:** Root-Zugriff vorhanden

### Wichtige Dateien

1. **`deployment/NEXT-STEPS.md`** - ⭐ **START HIER!** Vollständige Schritt-für-Schritt-Anleitung
2. **`deployment/DEPLOYMENT-MIT-WEB-TERMINAL.md`** - Detaillierte Anleitung mit Web-Terminal
3. **`deployment/SSH-KEY-SETUP.md`** - SSH-Key Konfiguration
4. **`deployment/DNS-SETUP.md`** - DNS-Informationen (bereits erledigt)
5. **`deployment/SERVER-INFO.md`** - Server-Details

### Konfigurationsdateien

- **`deployment/nginx.conf`** - Nginx-Konfiguration (bereits für invoice.crftn.de konfiguriert)
- **`deployment/invoice-calculator.service`** - Systemd Service-Datei
- **`.env.example`** - Vorlage für Umgebungsvariablen

---

## 📋 Deployment-Schritte (Kurzfassung)

### 1. Server vorbereiten

**Im Hetzner Cloud Console Web-Terminal** (https://console.hetzner.cloud):

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx git
npm install -g pnpm
mkdir -p /var/www/invoice-calculator
```

### 2. Projekt hochladen

**Option A: Mit rsync (vom lokalen Rechner):**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

**Option B: Mit Git (wenn Repo vorhanden):**
```bash
cd /var/www/invoice-calculator
git clone <repo-url> .
```

### 3. Projekt einrichten

```bash
cd /var/www/invoice-calculator
pnpm install
pnpm run build

# .env-Datei erstellen
nano .env
# Siehe .env.example für benötigte Variablen
```

### 4. Service einrichten

```bash
cp deployment/invoice-calculator.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable invoice-calculator
systemctl start invoice-calculator
```

### 5. Nginx konfigurieren

```bash
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl restart nginx
```

### 6. Firewall

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

### 7. SSL (optional)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d invoice.crftn.de -d www.invoice.crftn.de
```

---

## 🔑 SSH-Zugriff

**SSH-Key vorhanden:** `/Users/craftongmbh/Downloads/n8n_privatekey.ppk`

**Öffentlicher Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGiWX6to88GQ65B86WuF9YDl9Dq2YyND07cBI+PEHrDk eddsa-key-20250828
```

Siehe `deployment/SSH-KEY-SETUP.md` für Details.

**Alternative:** Hetzner Cloud Console Web-Terminal verwenden (kein SSH nötig!)

---

## 📝 Benötigte Umgebungsvariablen

Erstelle `.env` auf dem Server mit:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/invoice_calculator
JWT_SECRET=<sicherer-secret-key>
SUPABASE_URL=<supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
VITE_SUPABASE_URL=<supabase-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Siehe `.env.example` für vollständige Liste.

---

## 🛠️ Technologie-Stack

- **Frontend:** React + Vite + TypeScript
- **Backend:** Node.js + Express + tRPC
- **Database:** PostgreSQL (Drizzle ORM)
- **Auth:** Supabase
- **Build:** Vite + esbuild
- **Package Manager:** pnpm

---

## 📂 Projekt-Struktur

```
invoice-calculator/
├── client/          # React Frontend
├── server/          # Node.js Backend
├── shared/          # Geteilte Code-Dateien
├── drizzle/         # Datenbank-Schema
├── deployment/      # ⭐ Alle Deployment-Anleitungen
└── package.json     # Dependencies
```

---

## ✅ Was bereits erledigt ist

- ✅ DNS konfiguriert (invoice.crftn.de → 91.99.211.1)
- ✅ Nginx-Konfiguration vorbereitet
- ✅ Alle Deployment-Skripte erstellt
- ✅ Server-IP aktualisiert (91.99.211.1)

---

## 🆘 Hilfe bei Problemen

### Service startet nicht
```bash
journalctl -u invoice-calculator -n 50
systemctl status invoice-calculator
```

### Nginx-Fehler
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### DNS prüfen
```bash
nslookup invoice.crftn.de
# Sollte zeigen: 91.99.211.1
```

---

## 📞 Kontakt

Bei Fragen siehe die detaillierten Anleitungen in `deployment/`:
- `NEXT-STEPS.md` - Vollständige Anleitung
- `DEPLOYMENT-MIT-WEB-TERMINAL.md` - Mit Web-Terminal
- `SSH-PROBLEME-LOESEN.md` - SSH-Troubleshooting

---

## 🎯 Ziel

Nach erfolgreichem Deployment sollte die Anwendung erreichbar sein unter:
- http://invoice.crftn.de
- https://invoice.crftn.de (nach SSL-Setup)

**Viel Erfolg!** 🚀
