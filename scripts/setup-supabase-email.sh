#!/bin/bash
# Script zum Einrichten der Supabase E-Mail-Konfiguration

set -e

echo "📧 Supabase E-Mail-Konfiguration Setup"
echo "======================================"
echo ""

# Prüfe ob auf Server
if [ ! -d "/var/www/supabase" ]; then
    echo "❌ Fehler: Dieses Script muss auf dem Server ausgeführt werden"
    echo "   Bitte per SSH verbinden: ssh crftn"
    exit 1
fi

cd /var/www/supabase

echo "Aktuelle SMTP-Konfiguration:"
echo "----------------------------"
grep -E "SMTP_|MAILER_URLPATHS" .env | grep -v "^#"
echo ""

echo "Bitte geben Sie die SMTP-Daten aus Ihrem alten Supabase ein:"
echo ""

read -p "SMTP Host (z.B. smtp.gmail.com, smtp.ionos.de): " smtp_host
read -p "SMTP Port (587 für TLS, 465 für SSL): " smtp_port
read -p "SMTP Benutzername: " smtp_user
read -sp "SMTP Passwort: " smtp_pass
echo ""
read -p "Absender E-Mail-Adresse: " smtp_admin_email
read -p "Absender Name (z.B. 'Invoice Calculator'): " smtp_sender_name

echo ""
echo "Aktualisiere .env Datei..."

# Backup erstellen
cp .env .env.backup.$(date +%Y%m%d_%H%M%S)

# SMTP-Daten aktualisieren
sed -i "s|SMTP_HOST=.*|SMTP_HOST=${smtp_host}|g" .env
sed -i "s|SMTP_PORT=.*|SMTP_PORT=${smtp_port}|g" .env
sed -i "s|SMTP_USER=.*|SMTP_USER=${smtp_user}|g" .env
sed -i "s|SMTP_PASS=.*|SMTP_PASS=${smtp_pass}|g" .env
sed -i "s|SMTP_ADMIN_EMAIL=.*|SMTP_ADMIN_EMAIL=${smtp_admin_email}|g" .env
sed -i "s|SMTP_SENDER_NAME=.*|SMTP_SENDER_NAME=${smtp_sender_name}|g" .env

# E-Mail aktivieren
sed -i "s|ENABLE_EMAIL_SIGNUP=.*|ENABLE_EMAIL_SIGNUP=true|g" .env
sed -i "s|ENABLE_EMAIL_AUTOCONFIRM=.*|ENABLE_EMAIL_AUTOCONFIRM=false|g" .env

echo "✅ .env Datei aktualisiert"
echo ""
echo "Neue Konfiguration:"
echo "-------------------"
grep -E "SMTP_|ENABLE_EMAIL" .env | grep -v "^#"
echo ""

read -p "Supabase Auth-Service neu starten? (j/n): " restart
if [ "$restart" = "j" ] || [ "$restart" = "J" ] || [ "$restart" = "y" ] || [ "$restart" = "Y" ]; then
    echo "🔄 Starte Supabase Auth-Service neu..."
    docker compose restart auth
    echo "✅ Auth-Service neu gestartet"
    echo ""
    echo "Prüfe Logs (Strg+C zum Beenden):"
    docker compose logs -f auth | grep -i mail
else
    echo "⚠️  Bitte starten Sie Supabase manuell neu:"
    echo "   cd /var/www/supabase"
    echo "   docker compose restart auth"
fi

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "Nächste Schritte:"
echo "1. Testen Sie die Registrierung in der App"
echo "2. Prüfen Sie, ob die Bestätigungs-E-Mail ankommt"
echo "3. Prüfen Sie die Logs bei Problemen: docker compose logs auth | grep -i mail"
