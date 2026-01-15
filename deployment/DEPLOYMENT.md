# Deployment-Anleitung für Hetzner Server

## Übersicht: Mehrere Projekte auf einem Server

**Ja, auf einem Hetzner-Server können problemlos mehrere Projekte laufen!** Hier sind die gängigen Methoden:

### 1. **Verschiedene Ports + Reverse Proxy (Empfohlen)**
- Jedes Projekt läuft auf einem eigenen Port (z.B. 3000, 3001, 3002)
- Nginx leitet basierend auf der Domain zu den richtigen Ports weiter
- Beispiel:
  - `projekt1.de` → Port 3000
  - `projekt2.de` → Port 3001
  - `projekt3.de` → Port 3002

### 2. **Verschiedene Domains/Subdomains**
- Jedes Projekt hat seine eigene Domain oder Subdomain
- Nginx konfiguriert für jede Domain separat
- Beispiel:
  - `invoice.example.com` → Port 3000
  - `dashboard.example.com` → Port 3001

### 3. **Docker Container (Erweitert)**
- Jedes Projekt in einem eigenen Container
- Port-Mapping und Netzwerk-Isolation
- Ideal für komplexere Setups

---

## Schritt-für-Schritt: Domain-Anbindung

### Voraussetzungen
- Hetzner-Server mit Ubuntu/Debian
- Root- oder sudo-Zugriff
- Domain, die auf die Server-IP zeigt
- Node.js und npm/pnpm installiert

### Schritt 1: Server vorbereiten

```bash
# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Node.js installieren (falls nicht vorhanden)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx installieren
sudo apt install -y nginx

# PM2 installieren (optional, für Process Management)
sudo npm install -g pm2
```

### Schritt 2: Projekt auf Server hochladen

```bash
# Projekt-Verzeichnis erstellen
sudo mkdir -p /var/www/invoice-calculator
sudo chown -R $USER:$USER /var/www/invoice-calculator

# Projekt hochladen (mit scp, rsync oder git)
# Beispiel mit git:
cd /var/www/invoice-calculator
git clone <dein-repo-url> .

# Oder mit rsync vom lokalen Rechner:
# rsync -avz --exclude 'node_modules' ./ user@server:/var/www/invoice-calculator/
```

### Schritt 3: Projekt bauen und konfigurieren

```bash
cd /var/www/invoice-calculator

# Dependencies installieren
pnpm install  # oder npm install

# .env-Datei erstellen
nano .env
# Füge hier deine Umgebungsvariablen ein:
# DATABASE_URL=...
# SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
# JWT_SECRET=...
# PORT=3000
# NODE_ENV=production

# Projekt bauen
pnpm run build  # oder npm run build
```

### Schritt 4: Systemd Service einrichten

```bash
# Service-Datei kopieren
sudo cp deployment/invoice-calculator.service /etc/systemd/system/

# .env-Datei in Service-Datei einbinden (optional, besser als Environment-Variablen)
# Oder: EnvironmentFile=/var/www/invoice-calculator/.env in Service-Datei hinzufügen

# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable invoice-calculator
sudo systemctl start invoice-calculator

# Status prüfen
sudo systemctl status invoice-calculator
```

### Schritt 5: Nginx konfigurieren

```bash
# Nginx-Konfiguration kopieren
sudo cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator

# Domain in Konfiguration anpassen
sudo nano /etc/nginx/sites-available/invoice-calculator
# Ersetze "deine-domain.de" mit deiner tatsächlichen Domain

# Symlink erstellen
sudo ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neu starten
sudo systemctl restart nginx
```

### Schritt 6: SSL-Zertifikat einrichten (Let's Encrypt)

```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d deine-domain.de -d www.deine-domain.de

# Automatische Erneuerung testen
sudo certbot renew --dry-run
```

### Schritt 7: Firewall konfigurieren

```bash
# UFW Firewall aktivieren
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# Port 3000 sollte NICHT öffentlich erreichbar sein
# (nur über Nginx von localhost)
```

---

## Mehrere Projekte auf einem Server

### Beispiel: Zwei Projekte

**Projekt 1 (invoice-calculator):**
- Port: 3000
- Domain: `invoice.example.com`
- Service: `invoice-calculator.service`
- Nginx: `/etc/nginx/sites-available/invoice-calculator`

**Projekt 2 (anderes Projekt):**
- Port: 3001
- Domain: `dashboard.example.com`
- Service: `dashboard.service`
- Nginx: `/etc/nginx/sites-available/dashboard`

### Nginx-Konfiguration für mehrere Projekte

```nginx
# /etc/nginx/sites-available/invoice-calculator
server {
    listen 80;
    server_name invoice.example.com;
    location / {
        proxy_pass http://localhost:3000;
        # ... weitere Proxy-Einstellungen
    }
}

# /etc/nginx/sites-available/dashboard
server {
    listen 80;
    server_name dashboard.example.com;
    location / {
        proxy_pass http://localhost:3001;
        # ... weitere Proxy-Einstellungen
    }
}
```

---

## Wartung und Monitoring

### Logs ansehen

```bash
# Application-Logs
sudo journalctl -u invoice-calculator -f

# Nginx-Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Service neu starten

```bash
sudo systemctl restart invoice-calculator
sudo systemctl restart nginx
```

### Projekt aktualisieren

```bash
cd /var/www/invoice-calculator
git pull
pnpm install
pnpm run build
sudo systemctl restart invoice-calculator
```

---

## Troubleshooting

### Port bereits belegt
```bash
# Prüfen, welcher Prozess den Port verwendet
sudo lsof -i :3000
# Prozess beenden oder anderen Port verwenden
```

### Nginx-Fehler
```bash
# Konfiguration testen
sudo nginx -t
# Fehler in Logs prüfen
sudo tail -f /var/log/nginx/error.log
```

### Service startet nicht
```bash
# Status prüfen
sudo systemctl status invoice-calculator
# Logs ansehen
sudo journalctl -u invoice-calculator -n 50
```

---

## Sicherheitshinweise

1. **Firewall**: Nur Port 80/443 öffentlich, interne Ports (3000, 3001, etc.) nicht öffentlich
2. **SSL**: Immer HTTPS verwenden für Produktion
3. **Umgebungsvariablen**: Niemals Secrets in Git committen
4. **Updates**: Regelmäßig System und Dependencies aktualisieren
5. **Backups**: Regelmäßige Backups der Datenbank und Konfigurationen
