#!/usr/bin/expect -f

# Upload-Skript mit automatischer Passwort-Eingabe
# Verwendet expect für rsync

set SERVER_IP "91.99.211.1"
set SERVER_USER "root"
set SERVER_PATH "/var/www/invoice-calculator"
set SSH_PASSWORD "jNATjTEHJPaP"
set PROJECT_DIR "/Users/craftongmbh/Downloads/invoice-calculator"

set timeout 300

spawn rsync -avz --progress \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude 'dist' \
    --exclude '.env' \
    --exclude '*.log' \
    --exclude '.DS_Store' \
    -e "ssh -o StrictHostKeyChecking=no" \
    "$PROJECT_DIR/" "$SERVER_USER@$SERVER_IP:$SERVER_PATH/"

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
