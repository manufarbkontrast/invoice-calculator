# 🚀 Einfaches Deployment - Schritt für Schritt

## ⚠️ WICHTIG: Zwei verschiedene Orte!

- **Lokaler Mac** = Dein Computer (wo du jetzt bist)
- **Server** = Hetzner-Server (91.99.211.1)

Die Befehle müssen an verschiedenen Orten ausgeführt werden!

---

## Schritt 1: Mit dem Server verbinden

**Auf deinem Mac** (im Terminal):

```bash
ssh root@91.99.211.1
```

Gib das Passwort ein: `jNATjTEHJPaP`

**Wenn du erfolgreich verbunden bist**, siehst du so etwas:
```
root@cx23-manuserver:~#
```

Jetzt bist du **auf dem Server**! ✅

---

## Schritt 2: Server vorbereiten

**Auf dem Server** (nach SSH-Verbindung):

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

---

## Schritt 3: Projekt hochladen

**Auf deinem Mac** (neues Terminal-Fenster öffnen, während SSH-Verbindung läuft):

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Projekt auf Server hochladen
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

Gib das Passwort ein, wenn gefragt: `jNATjTEHJPaP`

---

## Schritt 4: Projekt einrichten

**Zurück auf dem Server** (im SSH-Terminal):

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install

# .env-Datei erstellen
nano .env
```

**In nano:**
- Füge deine Umgebungsvariablen ein (siehe `.env.example`)
- Speichern: `Ctrl+O`, dann `Enter`
- Beenden: `Ctrl+X`

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

## Schritt 5: Nginx konfigurieren

**Auf dem Server**:

```bash
cd /var/www/invoice-calculator

# Nginx-Konfiguration kopieren
cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Domain anpassen
nano /etc/nginx/sites-available/invoice-calculator
```

**In nano:**
- Suche nach `deine-domain.de` (mit `Ctrl+W`)
- Ersetze es mit deiner tatsächlichen Domain (z.B. `invoice.example.com`)
- Speichern: `Ctrl+O`, `Enter`, `Ctrl+X`

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

## Schritt 6: Firewall einrichten

**Auf dem Server**:

```bash
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable
# Bestätige mit 'y'
```

---

## Schritt 7: DNS konfigurieren

**Bei deinem Domain-Provider** (nicht auf dem Server):

- **Typ:** A-Record
- **Name:** @ (oder deine Subdomain)
- **Wert:** `91.99.211.1`

Warte 5-15 Minuten, bis DNS wirksam wird.

---

## Schritt 8: SSL einrichten (optional, aber empfohlen)

**Auf dem Server**:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d deine-domain.de
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

### Verbindung trennen
```bash
exit  # Beendet die SSH-Verbindung
```

---

## 📝 Zusammenfassung: Wo was ausführen?

| Befehl | Wo ausführen? |
|--------|---------------|
| `ssh root@91.99.211.1` | **Lokaler Mac** |
| `apt update`, `pnpm install`, etc. | **Server** (nach SSH) |
| `rsync ...` | **Lokaler Mac** |
| DNS konfigurieren | **Domain-Provider** (im Browser) |
