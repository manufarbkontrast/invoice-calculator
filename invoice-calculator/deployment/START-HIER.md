# 🚀 START HIER - Vollständiges Deployment

## Schnellstart (3 Schritte)

### Schritt 1: Server vorbereiten

Verbinde dich mit deinem Server und führe das Setup aus:

```bash
# Auf deinem Mac: Verbinde dich mit dem Server
ssh root@91.99.211.1

# Auf dem Server: Führe das Setup aus
bash <(curl -s https://raw.githubusercontent.com/nodesource/distributions/master/deb/setup_20.x) || true
apt update && apt upgrade -y
apt install -y nodejs nginx git
npm install -g pnpm
mkdir -p /var/www/invoice-calculator
```

### Schritt 2: Projekt hochladen

**Auf deinem Mac** (im Terminal, im Projekt-Verzeichnis):

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
bash deployment/upload-to-server.sh
```

Oder manuell:

```bash
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude 'dist' \
  ./ root@91.99.211.1:/var/www/invoice-calculator/
```

### Schritt 3: Projekt einrichten

**Auf dem Server**:

```bash
cd /var/www/invoice-calculator
bash deployment/setup-project.sh
```

Das Skript führt dich durch:
- Dependencies installieren
- .env-Datei erstellen
- Projekt bauen
- Service einrichten
- Nginx konfigurieren
- Firewall einrichten

---

## Oder: Alles auf einmal

**Auf deinem Mac**:

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
bash deployment/deploy-all.sh
```

Dieses Skript führt dich interaktiv durch alle Schritte.

---

## Was passiert?

1. ✅ Server wird vorbereitet (Node.js, Nginx, pnpm)
2. ✅ Projekt wird auf den Server hochgeladen
3. ✅ Dependencies werden installiert
4. ✅ Projekt wird gebaut
5. ✅ Systemd Service wird eingerichtet
6. ✅ Nginx wird konfiguriert
7. ✅ Firewall wird eingerichtet
8. ✅ Service wird gestartet

---

## Nach dem Deployment

1. **DNS konfigurieren**: A-Record für deine Domain → `91.99.211.1`
2. **SSL einrichten**: `ssh root@91.99.211.1 'certbot --nginx -d deine-domain.de'`
3. **Status prüfen**: `ssh root@91.99.211.1 'systemctl status invoice-calculator'`

---

## Hilfe

Bei Problemen siehe:
- `deployment/DEPLOYMENT.md` - Detaillierte Anleitung
- `deployment/QUICKSTART.md` - Schnellstart-Anleitung
