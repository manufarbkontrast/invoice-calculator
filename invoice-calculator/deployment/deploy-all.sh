#!/bin/bash

# Vollständiges Deployment-Skript
# Führt alle Schritte automatisch aus

set -e

# Konfiguration
SERVER_IP="91.99.211.1"
SERVER_USER="root"
SERVER_PATH="/var/www/invoice-calculator"
PROJECT_DIR="/Users/craftongmbh/Downloads/invoice-calculator"

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Invoice Calculator - Deployment      ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Schritt 1: Server-Setup
echo -e "${GREEN}📦 Schritt 1: Server-Setup${NC}"
echo "Lade setup-server.sh auf den Server und führe es aus..."
echo ""
read -p "Soll ich das Server-Setup jetzt durchführen? (j/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    echo "Kopiere Setup-Skript auf Server..."
    scp deployment/setup-server.sh "$SERVER_USER@$SERVER_IP:/tmp/"
    echo "Führe Server-Setup aus..."
    ssh "$SERVER_USER@$SERVER_IP" "bash /tmp/setup-server.sh"
    echo -e "${GREEN}✅ Server-Setup abgeschlossen${NC}"
else
    echo -e "${YELLOW}⏭️  Server-Setup übersprungen${NC}"
fi

echo ""

# Schritt 2: Projekt hochladen
echo -e "${GREEN}📤 Schritt 2: Projekt hochladen${NC}"
read -p "Soll ich das Projekt jetzt auf den Server hochladen? (j/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    bash deployment/upload-to-server.sh
    echo -e "${GREEN}✅ Upload abgeschlossen${NC}"
else
    echo -e "${YELLOW}⏭️  Upload übersprungen${NC}"
fi

echo ""

# Schritt 3: Projekt-Setup auf Server
echo -e "${GREEN}⚙️  Schritt 3: Projekt-Setup auf Server${NC}"
read -p "Soll ich das Projekt-Setup jetzt auf dem Server ausführen? (j/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    echo "Kopiere Setup-Skript auf Server..."
    scp deployment/setup-project.sh "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
    echo "Führe Projekt-Setup aus..."
    ssh "$SERVER_USER@$SERVER_IP" "cd $SERVER_PATH && bash setup-project.sh"
    echo -e "${GREEN}✅ Projekt-Setup abgeschlossen${NC}"
else
    echo -e "${YELLOW}⏭️  Projekt-Setup übersprungen${NC}"
    echo "Du kannst es später manuell ausführen:"
    echo "  ssh $SERVER_USER@$SERVER_IP"
    echo "  cd $SERVER_PATH"
    echo "  bash deployment/setup-project.sh"
fi

echo ""
echo -e "${GREEN}✅ Deployment-Prozess abgeschlossen!${NC}"
echo ""
echo -e "${YELLOW}📋 Nächste Schritte:${NC}"
echo "1. Konfiguriere DNS: A-Record für deine Domain → $SERVER_IP"
echo "2. SSL-Zertifikat einrichten: ssh $SERVER_USER@$SERVER_IP 'certbot --nginx -d deine-domain.de'"
echo "3. Prüfe den Status: ssh $SERVER_USER@$SERVER_IP 'systemctl status invoice-calculator'"
echo ""
