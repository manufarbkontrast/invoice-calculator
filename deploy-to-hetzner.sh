#!/bin/bash

# Hetzner Deployment Script für Invoice Calculator
# 
# Verwendung:
#   ./deploy-to-hetzner.sh
#
# Voraussetzungen:
#   - SSH-Zugriff auf Hetzner-Server
#   - Server-IP-Adresse
#   - Domain/Subdomain für die App

set -e  # Exit on error

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Invoice Calculator - Hetzner Deployment ===${NC}\n"

# Konfiguration abfragen
read -p "Hetzner Server IP-Adresse: " 46.224.64.210
read -p "SSH Benutzer (root): " ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINLxs9PFlinRG+Et/XOLFG1w/G1mweL7YQYhZU5tzNyW mw@crftn.de
SSH_USER=${SSH_USER:-root}
read -p "Domain/Subdomain (z.B. rechnungen.meinefirma.de): " DOMAIN invoice.crftn.de
read -p "Projektverzeichnis auf Server (/opt/invoice-calculator): " REMOTE_DIR
REMOTE_DIR=${REMOTE_DIR:-/opt/invoice-calculator}

echo -e "\n${YELLOW}Konfiguration:${NC}"
echo "  Server: ${SSH_USER}@${SERVER_IP}"
echo "  Domain: ${DOMAIN}"
echo "  Verzeichnis: ${REMOTE_DIR}"
echo ""

read -p "Fortfahren? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Abgebrochen."
    exit 1
fi

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo -e "${RED}Fehler: .env Datei nicht gefunden!${NC}"
    echo "Bitte erstelle eine .env Datei mit allen benötigten Variablen."
    exit 1
fi

echo -e "\n${GREEN}[1/6] Prüfe SSH-Verbindung...${NC}"
ssh -o ConnectTimeout=5 ${SSH_USER}@${SERVER_IP} "echo 'SSH-Verbindung erfolgreich'" || {
    echo -e "${RED}Fehler: SSH-Verbindung fehlgeschlagen!${NC}"
    exit 1
}

echo -e "\n${GREEN}[2/6] Installiere Docker auf Server (falls nicht vorhanden)...${NC}"
ssh ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
    if ! command -v docker &> /dev/null; then
        echo "Docker wird installiert..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sh get-docker.sh
        rm get-docker.sh
    else
        echo "Docker ist bereits installiert."
    fi
    
    if ! command -v docker compose &> /dev/null && ! docker-compose --version &> /dev/null; then
        echo "Docker Compose wird installiert..."
        apt-get update
        apt-get install -y docker-compose-plugin || apt-get install -y docker-compose
    else
        echo "Docker Compose ist bereits installiert."
    fi
ENDSSH

echo -e "\n${GREEN}[3/6] Erstelle Verzeichnis auf Server...${NC}"
ssh ${SSH_USER}@${SERVER_IP} "mkdir -p ${REMOTE_DIR}"

echo -e "\n${GREEN}[4/6] Kopiere Dateien auf Server...${NC}"
# Erstelle temporäres tar-Archiv
TEMP_TAR=$(mktemp)
tar --exclude='node_modules' \
    --exclude='.git' \
    --exclude='dist' \
    --exclude='.next' \
    --exclude='.env.local' \
    --exclude='*.log' \
    -czf ${TEMP_TAR} .

# Kopiere Archiv auf Server
scp ${TEMP_TAR} ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/app.tar.gz

# Entpacke auf Server
ssh ${SSH_USER}@${SERVER_IP} << ENDSSH
    cd ${REMOTE_DIR}
    tar -xzf app.tar.gz
    rm app.tar.gz
ENDSSH

# Lösche temporäres Archiv
rm ${TEMP_TAR}

echo -e "\n${GREEN}[5/6] Kopiere .env Datei auf Server...${NC}"
scp .env ${SSH_USER}@${SERVER_IP}:${REMOTE_DIR}/.env

echo -e "\n${GREEN}[6/6] Starte Docker Container...${NC}"
ssh ${SSH_USER}@${SERVER_IP} << ENDSSH
    cd ${REMOTE_DIR}
    
    # Prüfe ob docker-compose.prod.yml existiert
    if [ ! -f docker-compose.prod.yml ]; then
        echo "Fehler: docker-compose.prod.yml nicht gefunden!"
        exit 1
    fi
    
    # Baue und starte Container
    echo "Baue Docker Image..."
    docker compose -f docker-compose.prod.yml build
    
    echo "Starte Container..."
    docker compose -f docker-compose.prod.yml up -d
    
    echo "Warte 5 Sekunden..."
    sleep 5
    
    # Zeige Status
    docker compose -f docker-compose.prod.yml ps
ENDSSH

echo -e "\n${GREEN}✓ Deployment abgeschlossen!${NC}\n"

echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Konfiguriere Nginx (siehe HETZNER-DEPLOYMENT.md Schritt 4)"
echo "2. Richte SSL-Zertifikat ein: certbot --nginx -d ${DOMAIN}"
echo "3. Prüfe die App: http://${DOMAIN}"
echo ""
echo "Nginx-Konfiguration erstellen:"
echo "  ssh ${SSH_USER}@${SERVER_IP}"
echo "  nano /etc/nginx/sites-available/invoice-calculator"
echo "  # Kopiere Inhalt von nginx.conf.example und passe DOMAIN an"
echo ""
echo "Logs ansehen:"
echo "  ssh ${SSH_USER}@${SERVER_IP} 'cd ${REMOTE_DIR} && docker compose -f docker-compose.prod.yml logs -f'"


