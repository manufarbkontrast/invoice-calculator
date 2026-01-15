#!/bin/bash

# Projekt-Setup-Skript
# Führe dieses Skript im Projekt-Verzeichnis auf dem Server aus

set -e

echo "🚀 Starte Projekt-Setup..."

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Prüfe, ob wir im Projekt-Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Fehler: package.json nicht gefunden. Bist du im Projektverzeichnis?${NC}"
    exit 1
fi

PROJECT_DIR=$(pwd)

echo -e "${GREEN}📦 Schritt 1: Dependencies installieren...${NC}"
pnpm install

echo -e "${GREEN}📝 Schritt 2: .env-Datei prüfen...${NC}"
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env-Datei nicht gefunden!${NC}"
    if [ -f ".env.example" ]; then
        echo "Erstelle .env aus .env.example..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Bitte bearbeite jetzt die .env-Datei mit deinen Werten!${NC}"
        echo "Drücke Enter, wenn du fertig bist..."
        read
    else
        echo -e "${RED}❌ .env.example nicht gefunden! Bitte erstelle manuell eine .env-Datei.${NC}"
        exit 1
    fi
else
    echo "✅ .env-Datei vorhanden"
fi

echo -e "${GREEN}🔨 Schritt 3: Projekt bauen...${NC}"
pnpm run build

echo -e "${GREEN}⚙️  Schritt 4: Systemd Service einrichten...${NC}"
if [ -f "deployment/invoice-calculator.service" ]; then
    # Service-Datei anpassen (EnvironmentFile hinzufügen)
    sed "s|/var/www/invoice-calculator|$PROJECT_DIR|g" deployment/invoice-calculator.service > /tmp/invoice-calculator.service
    # EnvironmentFile hinzufügen, falls nicht vorhanden
    if ! grep -q "EnvironmentFile" /tmp/invoice-calculator.service; then
        sed -i '/WorkingDirectory/a EnvironmentFile='"$PROJECT_DIR"'/.env' /tmp/invoice-calculator.service
    fi
    
    cp /tmp/invoice-calculator.service /etc/systemd/system/invoice-calculator.service
    systemctl daemon-reload
    systemctl enable invoice-calculator
    echo "✅ Service installiert"
else
    echo -e "${YELLOW}⚠️  Service-Datei nicht gefunden${NC}"
fi

echo -e "${GREEN}🌐 Schritt 5: Nginx konfigurieren...${NC}"
if [ -f "deployment/nginx.conf" ]; then
    echo -e "${YELLOW}⚠️  Bitte gib deine Domain ein (z.B. invoice.example.com):${NC}"
    read -p "Domain: " DOMAIN
    
    if [ -z "$DOMAIN" ]; then
        echo -e "${RED}❌ Domain darf nicht leer sein!${NC}"
        exit 1
    fi
    
    # Nginx-Konfiguration anpassen
    sed "s/deine-domain.de/$DOMAIN/g" deployment/nginx.conf > /tmp/invoice-calculator-nginx.conf
    cp /tmp/invoice-calculator-nginx.conf /etc/nginx/sites-available/invoice-calculator
    
    # Symlink erstellen
    ln -sf /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
    
    # Standard-Konfiguration entfernen
    rm -f /etc/nginx/sites-enabled/default
    
    # Nginx testen
    if nginx -t; then
        systemctl restart nginx
        echo "✅ Nginx konfiguriert und neu gestartet"
    else
        echo -e "${RED}❌ Nginx-Konfiguration hat Fehler!${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Nginx-Konfiguration nicht gefunden${NC}"
fi

echo -e "${GREEN}🔥 Schritt 6: Firewall konfigurieren...${NC}"
ufw allow ssh
ufw allow 'Nginx Full'
echo "y" | ufw enable 2>/dev/null || true
echo "✅ Firewall konfiguriert"

echo -e "${GREEN}🚀 Schritt 7: Service starten...${NC}"
systemctl restart invoice-calculator
sleep 2

if systemctl is-active --quiet invoice-calculator; then
    echo -e "${GREEN}✅ Service läuft erfolgreich!${NC}"
else
    echo -e "${RED}❌ Service konnte nicht gestartet werden!${NC}"
    echo "Prüfe die Logs mit: journalctl -u invoice-calculator -n 50"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ Setup abgeschlossen!${NC}"
echo ""
echo -e "${YELLOW}📋 Nächste Schritte:${NC}"
echo "1. Konfiguriere DNS: A-Record für $DOMAIN → $(hostname -I | awk '{print $1}')"
echo "2. SSL-Zertifikat einrichten: sudo certbot --nginx -d $DOMAIN"
echo "3. Prüfe den Status: sudo systemctl status invoice-calculator"
echo "4. Logs ansehen: sudo journalctl -u invoice-calculator -f"
echo ""
