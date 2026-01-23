#!/bin/bash

# Nginx Setup Script für Invoice Calculator
# 
# Verwendung:
#   ./setup-nginx.sh
#
# Oder direkt auf dem Server:
#   ssh user@server 'bash -s' < setup-nginx.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== Nginx Setup für Invoice Calculator ===${NC}\n"

# Konfiguration abfragen
read -p "Hetzner Server IP-Adresse: " SERVER_IP
read -p "SSH Benutzer (root): " SSH_USER
SSH_USER=${SSH_USER:-root}
read -p "Domain/Subdomain (z.B. rechnungen.meinefirma.de): " DOMAIN

if [ -z "$DOMAIN" ]; then
    echo -e "${RED}Fehler: Domain ist erforderlich!${NC}"
    exit 1
fi

echo -e "\n${YELLOW}Konfiguration:${NC}"
echo "  Server: ${SSH_USER}@${SERVER_IP}"
echo "  Domain: ${DOMAIN}"
echo ""

read -p "Fortfahren? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo "Abgebrochen."
    exit 1
fi

echo -e "\n${GREEN}[1/4] Prüfe ob Nginx installiert ist...${NC}"
ssh ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
    if ! command -v nginx &> /dev/null; then
        echo "Nginx wird installiert..."
        apt-get update
        apt-get install -y nginx certbot python3-certbot-nginx
    else
        echo "Nginx ist bereits installiert."
    fi
ENDSSH

echo -e "\n${GREEN}[2/4] Erstelle Nginx-Konfiguration...${NC}"
# Erstelle temporäre Nginx-Konfiguration
NGINX_CONF=$(cat <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN};

    # Redirect to HTTPS (aktivieren nach SSL-Setup)
    # return 301 https://\$server_name\$request_uri;

    # Temporär: HTTP (bis SSL eingerichtet ist)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts für große Uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Body size limit für Datei-Uploads (50MB)
        client_max_body_size 50M;
    }
}
EOF
)

# Kopiere Konfiguration auf Server
echo "$NGINX_CONF" | ssh ${SSH_USER}@${SERVER_IP} "cat > /etc/nginx/sites-available/invoice-calculator"

echo -e "\n${GREEN}[3/4] Aktiviere Nginx-Konfiguration...${NC}"
ssh ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
    # Entferne alte Symlinks
    rm -f /etc/nginx/sites-enabled/invoice-calculator
    
    # Erstelle neuen Symlink
    ln -s /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
    
    # Teste Konfiguration
    nginx -t || {
        echo "Fehler: Nginx-Konfiguration ist ungültig!"
        exit 1
    }
    
    # Lade Nginx neu
    systemctl reload nginx
    echo "Nginx wurde neu geladen."
ENDSSH

echo -e "\n${GREEN}[4/4] Konfiguriere Firewall...${NC}"
ssh ${SSH_USER}@${SERVER_IP} << 'ENDSSH'
    # Prüfe ob ufw installiert ist
    if command -v ufw &> /dev/null; then
        ufw allow 22/tcp    # SSH
        ufw allow 80/tcp    # HTTP
        ufw allow 443/tcp   # HTTPS
        ufw --force enable || true
        echo "Firewall konfiguriert."
    else
        echo "UFW nicht installiert. Firewall-Regeln müssen manuell gesetzt werden."
    fi
ENDSSH

echo -e "\n${GREEN}✓ Nginx Setup abgeschlossen!${NC}\n"

echo -e "${YELLOW}Nächste Schritte:${NC}"
echo "1. Prüfe die App: http://${DOMAIN}"
echo "2. Richte SSL-Zertifikat ein:"
echo "   ssh ${SSH_USER}@${SERVER_IP}"
echo "   certbot --nginx -d ${DOMAIN}"
echo ""
echo "Nach SSL-Setup:"
echo "  - Entferne Kommentar in Nginx-Konfiguration für HTTPS-Redirect"
echo "  - systemctl reload nginx"


