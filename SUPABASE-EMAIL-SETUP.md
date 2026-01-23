# Supabase E-Mail-Konfiguration für Registrierung

## Aktuelle Konfiguration

Die E-Mail-Konfiguration befindet sich in `/var/www/supabase/.env` auf dem Server.

## SMTP-Einstellungen eintragen

Um E-Mails für die Registrierung zu aktivieren, müssen Sie die SMTP-Daten aus Ihrem alten Supabase eintragen:

### 1. SSH zum Server

```bash
ssh crftn
cd /var/www/supabase
nano .env
```

### 2. SMTP-Daten aktualisieren

Ersetzen Sie die folgenden Zeilen mit Ihren echten SMTP-Daten:

```env
# SMTP-Konfiguration (aus altem Supabase übernehmen)
SMTP_ADMIN_EMAIL=ihre-email@domain.de
SMTP_HOST=smtp.ihre-domain.de  # z.B. smtp.gmail.com, smtp.ionos.de, etc.
SMTP_PORT=587  # Oder 465 für SSL
SMTP_USER=ihr-smtp-benutzername
SMTP_PASS=ihr-smtp-passwort
SMTP_SENDER_NAME=Invoice Calculator  # Name, der als Absender angezeigt wird
```

### 3. E-Mail-URLs anpassen

Die URLs müssen auf Ihre Domain zeigen:

```env
# E-Mail-Bestätigungs-URLs (müssen auf Ihre Domain zeigen)
MAILER_URLPATHS_CONFIRMATION=https://invoice.crftn.de/auth/v1/verify
MAILER_URLPATHS_INVITE=https://invoice.crftn.de/auth/v1/verify
MAILER_URLPATHS_RECOVERY=https://invoice.crftn.de/auth/v1/verify
MAILER_URLPATHS_EMAIL_CHANGE=https://invoice.crftn.de/auth/v1/verify
```

### 4. E-Mail-Einstellungen

```env
# E-Mail-Registrierung aktivieren
ENABLE_EMAIL_SIGNUP=true

# Auto-Bestätigung deaktivieren (Benutzer muss E-Mail bestätigen)
ENABLE_EMAIL_AUTOCONFIRM=false
```

### 5. Supabase neu starten

Nach dem Speichern der `.env` Datei:

```bash
cd /var/www/supabase
docker compose down
docker compose up -d
```

## Häufige SMTP-Anbieter

### Gmail
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=ihre-email@gmail.com
SMTP_PASS=ihr-app-passwort  # App-Passwort, nicht normales Passwort!
```

### IONOS
```env
SMTP_HOST=smtp.ionos.de
SMTP_PORT=587
SMTP_USER=ihre-email@ihre-domain.de
SMTP_PASS=ihr-passwort
```

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=ihr-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@ihre-domain.mailgun.org
SMTP_PASS=ihr-mailgun-passwort
```

## Überprüfung

1. Registrieren Sie einen neuen Benutzer in der App
2. Prüfen Sie, ob eine Bestätigungs-E-Mail gesendet wurde
3. Prüfen Sie die Supabase-Logs:

```bash
cd /var/www/supabase
docker compose logs auth | grep -i mail
```

## Troubleshooting

### Keine E-Mails werden gesendet

1. Prüfen Sie die SMTP-Daten (Benutzername, Passwort, Host, Port)
2. Prüfen Sie die Firewall (Port 587 oder 465 muss offen sein)
3. Prüfen Sie die Logs: `docker compose logs auth`

### E-Mail kommt im Spam-Ordner an

- Verwenden Sie einen seriösen SMTP-Anbieter
- Stellen Sie sicher, dass SPF/DKIM für Ihre Domain konfiguriert ist

### "Connection refused" Fehler

- Prüfen Sie, ob der SMTP-Port (587/465) von Ihrem Server aus erreichbar ist
- Manche Anbieter blockieren Verbindungen von unbekannten IPs
