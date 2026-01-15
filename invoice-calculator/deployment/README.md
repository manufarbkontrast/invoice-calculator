# Deployment-Dateien

Dieser Ordner enthält alle notwendigen Konfigurationsdateien für das Deployment auf einem Hetzner-Server.

## Dateien

- **`nginx.conf`** - Nginx Reverse Proxy Konfiguration
- **`invoice-calculator.service`** - Systemd Service-Datei
- **`deploy.sh`** - Automatisches Deployment-Skript
- **`DEPLOYMENT.md`** - Ausführliche Deployment-Anleitung

## Schnellstart

1. **Domain auf Server-IP zeigen lassen** (DNS-Einstellungen bei deinem Domain-Provider)

2. **Auf dem Server ausführen:**
```bash
# Projekt hochladen
cd /var/www
sudo mkdir -p invoice-calculator
sudo chown -R $USER:$USER invoice-calculator
# ... Projekt hier hochladen ...

# Dependencies installieren und bauen
cd invoice-calculator
pnpm install
pnpm run build

# .env-Datei erstellen (siehe .env.example im Hauptverzeichnis)
nano .env

# Service einrichten
sudo cp deployment/invoice-calculator.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable invoice-calculator
sudo systemctl start invoice-calculator

# Nginx konfigurieren
sudo cp deployment/nginx.conf /etc/nginx/sites-available/invoice-calculator
sudo nano /etc/nginx/sites-available/invoice-calculator  # Domain anpassen!
sudo ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# SSL einrichten (optional)
sudo certbot --nginx -d deine-domain.de
```

3. **Fertig!** Die Anwendung sollte jetzt unter deiner Domain erreichbar sein.

## Mehrere Projekte

Für jedes weitere Projekt:
- Anderen Port verwenden (z.B. 3001, 3002, ...)
- Eigene Service-Datei erstellen
- Eigene Nginx-Konfiguration mit eigener Domain

Siehe `DEPLOYMENT.md` für Details.
