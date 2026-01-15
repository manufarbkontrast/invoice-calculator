#!/bin/bash

# Upload-Skript für das Projekt auf den Hetzner-Server
# Führe dieses Skript auf deinem lokalen Rechner aus

set -e

# Server-Konfiguration
SERVER_IP="91.99.211.1"
SERVER_USER="root"
SERVER_PATH="/var/www/invoice-calculator"
PROJECT_DIR="/Users/craftongmbh/Downloads/invoice-calculator"

# Farben
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📤 Lade Projekt auf Server hoch...${NC}"
echo "Server: $SERVER_USER@$SERVER_IP"
echo "Ziel: $SERVER_PATH"
echo ""

# Prüfe, ob rsync verfügbar ist
if ! command -v rsync &> /dev/null; then
    echo -e "${RED}❌ rsync ist nicht installiert!${NC}"
    echo "Installiere mit: brew install rsync"
    exit 1
fi

# Prüfe, ob wir im Projekt-Verzeichnis sind
cd "$PROJECT_DIR" || {
    echo -e "${RED}❌ Projekt-Verzeichnis nicht gefunden: $PROJECT_DIR${NC}"
    exit 1
}

# Prüfe SSH-Verbindung
echo -e "${YELLOW}🔍 Prüfe SSH-Verbindung...${NC}"
if ! ssh -o ConnectTimeout=5 "$SERVER_USER@$SERVER_IP" "echo 'Connection OK'" &>/dev/null; then
    echo -e "${RED}❌ Kann nicht zum Server verbinden!${NC}"
    echo "Bitte prüfe:"
    echo "1. Ist der Server erreichbar?"
    echo "2. Ist SSH konfiguriert?"
    echo "3. Hast du den richtigen SSH-Key?"
    exit 1
fi

echo -e "${GREEN}✅ Verbindung erfolgreich${NC}"
echo ""

# Erstelle Verzeichnis auf Server
echo -e "${YELLOW}📁 Erstelle Verzeichnis auf Server...${NC}"
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $SERVER_PATH"

# Upload mit rsync
echo -e "${GREEN}📤 Lade Dateien hoch (dies kann einige Minuten dauern)...${NC}"
rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    "$PROJECT_DIR/" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

echo ""
echo -e "${GREEN}✅ Upload abgeschlossen!${NC}"
echo ""
echo -e "${YELLOW}📋 Nächste Schritte:${NC}"
echo "1. Verbinde dich mit dem Server: ssh $SERVER_USER@$SERVER_IP"
echo "2. Wechsle ins Projekt-Verzeichnis: cd $SERVER_PATH"
echo "3. Führe das Setup aus: bash deployment/setup-project.sh"
echo ""
