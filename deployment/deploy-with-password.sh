#!/bin/bash

# Deployment-Skript mit Passwort-Unterstützung
# Verwendet expect für automatische Passwort-Eingabe

set -e

SERVER_IP="91.99.211.1"
SERVER_USER="root"
SERVER_PATH="/var/www/invoice-calculator"
PROJECT_DIR="/Users/craftongmbh/Downloads/invoice-calculator"
SSH_PASSWORD="jNATjTEHJPaP"

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

# Prüfe, ob expect installiert ist
if ! command -v expect &> /dev/null; then
    echo -e "${YELLOW}📦 Installiere expect...${NC}"
    if [[ "$OSTYPE" == "darwin"* ]]; then
        if command -v brew &> /dev/null; then
            brew install expect
        else
            echo -e "${RED}❌ Homebrew nicht gefunden. Bitte installiere expect manuell:${NC}"
            echo "brew install expect"
            exit 1
        fi
    else
        echo -e "${RED}❌ expect nicht installiert. Bitte installiere es manuell.${NC}"
        exit 1
    fi
fi

# Funktion für SSH mit Passwort
ssh_with_password() {
    expect << EOF
set timeout 30
spawn ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "$@"
expect {
    "password:" {
        send "$SSH_PASSWORD\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}
EOF
}

# Funktion für SCP mit Passwort
scp_with_password() {
    expect << EOF
set timeout 300
spawn scp -o StrictHostKeyChecking=no "$1" $SERVER_USER@$SERVER_IP:"$2"
expect {
    "password:" {
        send "$SSH_PASSWORD\r"
        exp_continue
    }
    "yes/no" {
        send "yes\r"
        exp_continue
    }
    eof
}
EOF
}

# Funktion für rsync mit Passwort
rsync_with_password() {
    SSHPASS="$SSH_PASSWORD" sshpass -e rsync -avz --progress \
        -e "ssh -o StrictHostKeyChecking=no" \
        "$1" "$SERVER_USER@$SERVER_IP:$2"
}

echo -e "${GREEN}📦 Schritt 1: Server vorbereiten...${NC}"
ssh_with_password "bash -c 'apt update && apt upgrade -y || true'"
ssh_with_password "bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || true'"
ssh_with_password "apt install -y nodejs nginx git || true"
ssh_with_password "npm install -g pnpm || true"
ssh_with_password "mkdir -p $SERVER_PATH || true"

echo -e "${GREEN}✅ Server vorbereitet${NC}"
echo ""

echo -e "${GREEN}📤 Schritt 2: Projekt hochladen...${NC}"
cd "$PROJECT_DIR"

# Prüfe, ob sshpass installiert ist (für rsync)
if command -v sshpass &> /dev/null; then
    SSHPASS="$SSH_PASSWORD" sshpass -e rsync -avz --progress \
        --exclude 'node_modules' \
        --exclude '.git' \
        --exclude 'dist' \
        --exclude '.env' \
        --exclude '*.log' \
        --exclude '.DS_Store' \
        -e "ssh -o StrictHostKeyChecking=no" \
        ./ "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"
else
    echo -e "${YELLOW}⚠️  sshpass nicht installiert. Verwende scp für einzelne Dateien...${NC}"
    # Alternative: Wichtige Dateien einzeln kopieren
    ssh_with_password "mkdir -p $SERVER_PATH/deployment"
    scp_with_password "deployment/setup-project.sh" "$SERVER_PATH/deployment/"
    scp_with_password "deployment/invoice-calculator.service" "$SERVER_PATH/deployment/"
    scp_with_password "deployment/nginx.conf" "$SERVER_PATH/deployment/"
    scp_with_password "package.json" "$SERVER_PATH/"
    scp_with_password "package-lock.json" "$SERVER_PATH/" 2>/dev/null || true
    scp_with_password "pnpm-lock.yaml" "$SERVER_PATH/" 2>/dev/null || true
    echo -e "${YELLOW}⚠️  Bitte lade den Rest manuell hoch oder installiere sshpass${NC}"
fi

echo -e "${GREEN}✅ Projekt hochgeladen${NC}"
echo ""

echo -e "${GREEN}⚙️  Schritt 3: Projekt auf Server einrichten...${NC}"
echo -e "${YELLOW}⚠️  Bitte gib deine Domain ein (z.B. invoice.example.com):${NC}"
read -p "Domain: " DOMAIN

if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
    echo -e "${YELLOW}⚠️  Keine Domain angegeben, verwende localhost${NC}"
fi

# Führe Setup auf Server aus
ssh_with_password "cd $SERVER_PATH && bash -c '
    pnpm install || npm install || true
    pnpm run build || npm run build || true
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
        fi
    fi
    if [ -f deployment/invoice-calculator.service ]; then
        sed \"s|/var/www/invoice-calculator|$SERVER_PATH|g\" deployment/invoice-calculator.service > /tmp/invoice-calculator.service
        if ! grep -q EnvironmentFile /tmp/invoice-calculator.service; then
            sed -i \"s|WorkingDirectory=.*|&\nEnvironmentFile=$SERVER_PATH/.env|g\" /tmp/invoice-calculator.service
        fi
        cp /tmp/invoice-calculator.service /etc/systemd/system/
        systemctl daemon-reload
        systemctl enable invoice-calculator
    fi
    if [ -f deployment/nginx.conf ]; then
        sed \"s/deine-domain.de/$DOMAIN/g\" deployment/nginx.conf > /etc/nginx/sites-available/invoice-calculator
        ln -sf /etc/nginx/sites-available/invoice-calculator /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl restart nginx
    fi
    ufw allow ssh
    ufw allow \"Nginx Full\"
    echo y | ufw enable || true
    systemctl restart invoice-calculator || true
'"

echo ""
echo -e "${GREEN}✅ Deployment abgeschlossen!${NC}"
echo ""
echo -e "${YELLOW}📋 Nächste Schritte:${NC}"
echo "1. Konfiguriere DNS: A-Record für $DOMAIN → $SERVER_IP"
echo "2. SSL einrichten: ssh $SERVER_USER@$SERVER_IP 'certbot --nginx -d $DOMAIN'"
echo "3. Status prüfen: ssh $SERVER_USER@$SERVER_IP 'systemctl status invoice-calculator'"
echo "4. .env-Datei bearbeiten: ssh $SERVER_USER@$SERVER_IP 'nano $SERVER_PATH/.env'"
echo ""
