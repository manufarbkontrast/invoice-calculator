# Hetzner Server Deployment Guide

Diese Anleitung zeigt, wie du die Invoice Calculator App auf einem Hetzner-Server deployst und mit einer IONOS-Subdomain verbindest.

## Voraussetzungen

- Hetzner Cloud Server (Ubuntu 22.04 oder neuer)
- IONOS Domain mit DNS-Zugriff
- SSH-Zugriff auf den Hetzner-Server

## Schritt 1: Hetzner Server Setup

### 1.1 Server erstellen

1. Gehe zu [Hetzner Cloud Console](https://console.hetzner.cloud/)
2. Erstelle einen neuen Server:
   - **Image:** Ubuntu 22.04
   - **Type:** CPX11 (2 vCPU, 4 GB RAM) oder größer
   - **Location:** Wähle den Standort (z.B. Nürnberg)
   - **SSH Key:** Füge deinen SSH-Key hinzu
3. Notiere dir die **IP-Adresse** des Servers

### 1.2 Server vorbereiten

Verbinde dich per SSH:

```bash
ssh root@DEINE_IP_ADRESSE
```

Führe folgende Befehle aus:

```bash
# System aktualisieren
apt update && apt upgrade -y

# Docker installieren
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Docker Compose installieren
apt install docker-compose-plugin -y

# Nginx installieren (für Reverse Proxy)
apt install nginx certbot python3-certbot-nginx -y

# Firewall konfigurieren
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable

# Benutzer für die App erstellen (optional, aber empfohlen)
adduser appuser
usermod -aG docker appuser
```

## Schritt 2: IONOS DNS-Konfiguration

### 2.1 Subdomain erstellen

1. Gehe zu [IONOS Control Panel](https://www.ionos.de/control-panel)
2. Wähle deine Domain aus
3. Gehe zu **DNS-Verwaltung** → **DNS-Einstellungen**
4. Füge einen neuen **A-Record** hinzu:
   - **Name:** `rechnungen` (oder wie du die Subdomain nennen möchtest)
   - **Typ:** A
   - **Wert:** `DEINE_HETZNER_IP_ADRESSE`
   - **TTL:** 3600 (Standard)

**Beispiel:**
- Domain: `meinefirma.de`
- Subdomain: `rechnungen.meinefirma.de`
- IP: `123.45.67.89`

### 2.2 DNS-Propagierung prüfen

Warte 5-15 Minuten, dann prüfe die DNS-Propagierung:

```bash
# Auf deinem lokalen Rechner
dig rechnungen.meinefirma.de
# oder
nslookup rechnungen.meinefirma.de
```

Die Antwort sollte deine Hetzner-IP-Adresse zeigen.

## Schritt 3: App auf Server deployen

### 3.1 Code auf Server kopieren

**Option A: Git Repository (empfohlen)**

```bash
# Auf dem Server
cd /opt
git clone DEIN_GIT_REPOSITORY invoice-calculator
cd invoice-calculator
```

**Option B: SCP (wenn kein Git)**

```bash
# Auf deinem lokalen Rechner
scp -r /Volumes/T7/Arbeit\ /Projekte\ Cursor/invoice-calculator root@DEINE_IP:/opt/invoice-calculator
```

### 3.2 Environment-Variablen erstellen

```bash
# Auf dem Server
cd /opt/invoice-calculator
nano .env
```

Füge alle benötigten Umgebungsvariablen ein:

```env
# Database
DATABASE_URL=postgresql://postgres.lmnocikatjrjzvxfzkcj:135Crftn%21Neu@aws-1-eu-west-2.pooler.supabase.com:6543/postgres

# Supabase Server
SUPABASE_URL=https://lmnocikatjrjzvxfzkcj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein_service_role_key

# Supabase Client (für Build)
VITE_SUPABASE_URL=https://lmnocikatjrjzvxfzkcj.supabase.co
VITE_SUPABASE_ANON_KEY=dein_anon_key

# Optional: Stripe
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID_PRO=
STRIPE_PRICE_ID_BUSINESS=
STRIPE_WEBHOOK_SECRET=

# Optional: OpenAI
OPENAI_API_KEY=
```

Speichere mit `Ctrl+O`, `Enter`, `Ctrl+X`.

### 3.3 Docker-Compose anpassen

Die `docker-compose.yml` muss für Production angepasst werden. Siehe `docker-compose.prod.yml` (wird im nächsten Schritt erstellt).

### 3.4 App starten

```bash
cd /opt/invoice-calculator
docker compose -f docker-compose.prod.yml up -d --build
```

## Schritt 4: Nginx Reverse Proxy Setup

### 4.1 Nginx-Konfiguration erstellen

```bash
nano /etc/nginx/sites-available/invoice-calculator
```

Füge folgende Konfiguration ein (ersetze `rechnungen.meinefirma.de` mit deiner Subdomain):

```nginx
server {
    listen 80;
    server_name rechnungen.meinefirma.de;

    # Redirect to HTTPS (wird nach SSL-Setup aktiv)
    # return 301 https://$server_name$request_uri;

    # Temporär: HTTP (bis SSL eingerichtet ist)
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
        
        # Timeouts für große Uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

Aktiviere die Konfiguration:

```bash
ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
nginx -t  # Teste die Konfiguration
systemctl reload nginx
```

### 4.2 SSL-Zertifikat mit Let's Encrypt

```bash
# SSL-Zertifikat erstellen
certbot --nginx -d rechnungen.meinefirma.de

# Folgende Fragen beantworten:
# - Email: Deine Email-Adresse
# - Terms: Y
# - Share email: N (optional)
# - Redirect HTTP to HTTPS: 2 (Yes)
```

Certbot aktualisiert automatisch die Nginx-Konfiguration für HTTPS.

### 4.3 Auto-Renewal einrichten

```bash
# Teste die Auto-Renewal-Funktion
certbot renew --dry-run

# Auto-Renewal läuft automatisch über systemd timer
systemctl status certbot.timer
```

## Schritt 5: Firewall & Sicherheit

### 5.1 Port-Konfiguration anpassen

Die App läuft jetzt nur noch intern auf Port 3000. Nginx läuft auf Port 80/443.

```bash
# Prüfe, dass nur Nginx von außen erreichbar ist
ufw status
```

### 5.2 Fail2Ban installieren (optional, aber empfohlen)

```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

## Schritt 6: Monitoring & Logs

### 6.1 Logs ansehen

```bash
# Docker Container Logs
docker compose -f docker-compose.prod.yml logs -f

# Nginx Logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 6.2 Container-Status prüfen

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml top
```

## Schritt 7: Updates deployen

Wenn du Updates machen möchtest:

```bash
cd /opt/invoice-calculator

# Code aktualisieren (wenn Git verwendet)
git pull

# Oder manuell aktualisieren
# ... Code kopieren ...

# Container neu bauen und starten
docker compose -f docker-compose.prod.yml up -d --build

# Alte Images aufräumen
docker image prune -f
```

## Troubleshooting

### App lädt nicht

```bash
# Prüfe Container-Status
docker compose -f docker-compose.prod.yml ps

# Prüfe Logs
docker compose -f docker-compose.prod.yml logs invoice-calculator

# Prüfe Nginx
nginx -t
systemctl status nginx

# Prüfe Ports
netstat -tulpn | grep :3000
netstat -tulpn | grep :80
netstat -tulpn | grep :443
```

### SSL-Zertifikat erneuern

```bash
certbot renew
systemctl reload nginx
```

### DNS-Propagierung prüfen

```bash
# Von verschiedenen Standorten testen
dig rechnungen.meinefirma.de @8.8.8.8
dig rechnungen.meinefirma.de @1.1.1.1
```

## Nützliche Befehle

```bash
# Container stoppen
docker compose -f docker-compose.prod.yml down

# Container starten
docker compose -f docker-compose.prod.yml up -d

# Container neu starten
docker compose -f docker-compose.prod.yml restart

# Logs in Echtzeit
docker compose -f docker-compose.prod.yml logs -f invoice-calculator

# In Container einloggen
docker compose -f docker-compose.prod.yml exec invoice-calculator sh
```

## Checkliste

- [ ] Hetzner Server erstellt
- [ ] Docker & Docker Compose installiert
- [ ] Nginx installiert
- [ ] Firewall konfiguriert
- [ ] DNS A-Record bei IONOS erstellt
- [ ] DNS-Propagierung geprüft
- [ ] Code auf Server kopiert
- [ ] `.env` Datei erstellt
- [ ] Docker Container gestartet
- [ ] Nginx konfiguriert
- [ ] SSL-Zertifikat installiert
- [ ] App über Subdomain erreichbar
- [ ] HTTPS funktioniert

## Support

Bei Problemen:
1. Prüfe die Logs (siehe Schritt 6)
2. Prüfe die Firewall-Regeln
3. Prüfe die DNS-Konfiguration
4. Prüfe die Nginx-Konfiguration



