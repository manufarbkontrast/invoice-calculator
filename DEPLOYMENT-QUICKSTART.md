# Quick Start: Deployment auf Hetzner

## Schnellstart (für erfahrene Nutzer)

### 1. Server vorbereiten

```bash
# Auf dem Hetzner Server
apt update && apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
apt install docker-compose-plugin nginx certbot python3-certbot-nginx -y
ufw allow 22,80,443/tcp && ufw enable
```

### 2. DNS bei IONOS konfigurieren

1. IONOS Control Panel → DNS-Verwaltung
2. Neuer A-Record:
   - Name: `rechnungen` (oder gewünschter Name)
   - Typ: A
   - Wert: `DEINE_HETZNER_IP`
   - TTL: 3600

### 3. App deployen

```bash
# Code auf Server kopieren (Git oder SCP)
cd /opt
git clone DEIN_REPO invoice-calculator
# ODER: scp -r ./invoice-calculator root@IP:/opt/

# Environment-Variablen setzen
cd /opt/invoice-calculator
nano .env  # Alle Variablen eintragen

# App starten
docker compose -f docker-compose.prod.yml up -d --build
```

### 4. Nginx konfigurieren

```bash
# Nginx Config erstellen
cp nginx.conf.example /etc/nginx/sites-available/invoice-calculator
nano /etc/nginx/sites-available/invoice-calculator  # Domain anpassen!

# Aktivieren
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### 5. SSL einrichten

```bash
certbot --nginx -d rechnungen.meinefirma.de
# Fragen beantworten, HTTPS-Redirect wählen
```

### 6. Fertig! 🎉

Die App sollte jetzt unter `https://rechnungen.meinefirma.de` erreichbar sein.

## Wichtige Dateien

- `.env` - Alle Umgebungsvariablen
- `docker-compose.prod.yml` - Production Docker Compose
- `/etc/nginx/sites-available/invoice-calculator` - Nginx Config

## Updates

```bash
cd /opt/invoice-calculator
git pull  # oder Code aktualisieren
docker compose -f docker-compose.prod.yml up -d --build
```

## Logs

```bash
docker compose -f docker-compose.prod.yml logs -f
```



