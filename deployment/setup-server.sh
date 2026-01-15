#!/bin/bash

# Vollständiges Server-Setup-Skript für invoice-calculator
# Führe dieses Skript auf dem Hetzner-Server aus (als root)

set -e  # Bei Fehler abbrechen

echo "🚀 Starte Server-Setup für invoice-calculator..."
echo ""

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Prüfe, ob als root ausgeführt
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Bitte als root ausführen (sudo ./setup-server.sh)${NC}"
    exit 1
fi

echo -e "${GREEN}📦 Schritt 1: System aktualisieren...${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}📦 Schritt 2: Node.js installieren...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
else
    echo "Node.js ist bereits installiert: $(node --version)"
fi

echo -e "${GREEN}📦 Schritt 3: Nginx installieren...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
else
    echo "Nginx ist bereits installiert: $(nginx -v 2>&1)"
fi

echo -e "${GREEN}📦 Schritt 4: pnpm installieren...${NC}"
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
else
    echo "pnpm ist bereits installiert: $(pnpm --version)"
fi

echo -e "${GREEN}📦 Schritt 5: UFW Firewall installieren...${NC}"
if ! command -v ufw &> /dev/null; then
    apt install -y ufw
fi

echo -e "${GREEN}📦 Schritt 6: Projekt-Verzeichnis erstellen...${NC}"
mkdir -p /var/www/invoice-calculator
chown -R $SUDO_USER:$SUDO_USER /var/www/invoice-calculator 2>/dev/null || chown -R www-data:www-data /var/www/invoice-calculator

echo -e "${GREEN}✅ Basis-Setup abgeschlossen!${NC}"
echo ""
echo -e "${YELLOW}📝 Nächste Schritte:${NC}"
echo "1. Lade das Projekt auf den Server hoch (siehe upload-to-server.sh)"
echo "2. Führe 'setup-project.sh' im Projekt-Verzeichnis aus"
echo ""
