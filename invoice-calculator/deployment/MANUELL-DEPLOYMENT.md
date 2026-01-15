# 🔧 Manuelles Deployment - Schritt für Schritt

## ⚠️ WICHTIG: Zwei verschiedene Orte!

- **Lokaler Mac** = Dein Computer (wo du jetzt bist)  
- **Server** = Hetzner-Server (91.99.211.1)

Die Befehle müssen an verschiedenen Orten ausgeführt werden!

---

## Schritt 1: SSH-Verbindung herstellen

**Auf deinem Mac** (im Terminal):

```bash
ssh root@91.99.211.1
```

Gib das Passwort ein, wenn gefragt: `jNATjTEHJPaP`

**Wenn du erfolgreich verbunden bist**, siehst du so etwas:
```
root@cx23-manuserver:~#
```

Jetzt bist du **auf dem Server**! ✅

**Falls das nicht funktioniert:**
- Prüfe in der Hetzner Cloud Console das richtige Passwort
- Oder verwende einen anderen Benutzer (falls konfiguriert)
- Oder richte SSH-Keys ein (siehe unten)

## Schritt 2: Server vorbereiten (auf dem Server)

**WICHTIG:** Diese Befehle werden **auf dem Server** ausgeführt (nach SSH-Verbindung)!

Nach erfolgreicher Verbindung, führe aus:

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx installieren
apt install -y nginx

# Git installieren
apt install -y git

# pnpm installieren
npm install -g pnpm

# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
```

## Schritt 3: Projekt hochladen (vom Mac)

**Auf deinem Mac**, im Terminal:

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Mit rsync (wenn SSH funktioniert)
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

**Oder mit scp:**
```bash
scp -r . root@91.99.211.1:/var/www/invoice-calculator/
```

**Oder mit Git** (wenn Projekt in Git-Repo):
```bash
# Auf dem Server:
cd /var/www/invoice-calculator
git clone <dein-repo-url> .
```

## Schritt 4: Projekt einrichten (auf dem Server)

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
# Füge deine Umgebungsvariablen ein (siehe .env.example)

# Projekt bauen
pnpm run build
```

## Schritt 5: Service einrichten (auf dem Server)

```bash
cd /var/www/invoice-calculator

# Service-Datei kopieren und anpassen
cp deployment/invoice-calculator.service /etc/systemd/system/
nano /etc/systemd/system/invoice-calculator.service
# Stelle sicher, dass EnvironmentFile=/var/www/invoice-calculator/.env enthalten ist

# Service aktivieren
systemctl daemon-reload
systemctl enable invoice-calculator
systemctl start invoice-calculator

# Status prüfen
systemctl status invoice-calculator
```

## Schritt 6: Nginx konfigurieren (auf dem Server)

```bash
cd /var/www/invoice-calculator

# Nginx-Konfiguration kopieren
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Domain anpassen
nano /etc/nginx/sites-available/invoice-calculator
# Ersetze "deine-domain.de" mit deiner tatsächlichen Domain

# Aktivieren
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Testen und starten
nginx -t
systemctl restart nginx
```

## Schritt 7: Firewall einrichten (auf dem Server)

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
```

## Schritt 8: DNS konfigurieren

Bei deinem Domain-Provider:
- **Typ:** A-Record
- **Name:** @ (oder Subdomain)
- **Wert:** 91.99.211.1

## Schritt 9: SSL einrichten (optional, aber empfohlen)

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d deine-domain.de
```

---

## SSH-Keys einrichten (für zukünftige Verbindungen)

**Auf deinem Mac:**

```bash
# Prüfe, ob bereits ein Key existiert
ls -la ~/.ssh/id_rsa.pub

# Falls nicht, erstelle einen
ssh-keygen -t rsa -b 4096

# Key anzeigen
cat ~/.ssh/id_rsa.pub
```

**Auf dem Server:**

```bash
# Verbinde dich mit Passwort
ssh root@91.99.211.1

# Auf dem Server:
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Füge den öffentlichen Key ein (aus cat ~/.ssh/id_rsa.pub)
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

Dann funktioniert SSH ohne Passwort!

---

## Hilfe bei Problemen

### Service startet nicht
```bash
journalctl -u invoice-calculator -n 50
```

### Nginx-Fehler
```bash
nginx -t
tail -f /var/log/nginx/error.log
```

### Port bereits belegt
```bash
lsof -i :3000
```
