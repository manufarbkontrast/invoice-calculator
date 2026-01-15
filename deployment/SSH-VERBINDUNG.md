# 🔑 SSH-Verbindung zum Server einrichten

## Schnellstart: Mit SSH-Key verbinden

### Schritt 1: PuTTY installieren (falls noch nicht vorhanden)

```bash
brew install putty
```

### Schritt 2: Key konvertieren

```bash
# Erstelle .ssh Verzeichnis (falls nicht vorhanden)
mkdir -p ~/.ssh

# Konvertiere .ppk zu OpenSSH Format
puttygen /Users/craftongmbh/Downloads/n8n_privatekey.ppk -O private-openssh -o ~/.ssh/invoice_server_key

# Setze die richtigen Berechtigungen
chmod 600 ~/.ssh/invoice_server_key

# Extrahiere öffentlichen Key
puttygen /Users/craftongmbh/Downloads/n8n_privatekey.ppk -O public-openssh -o ~/.ssh/invoice_server_key.pub
```

### Schritt 3: Öffentlichen Key auf Server hinzufügen

**Option A: Mit Hetzner Cloud Console Web-Terminal**

1. Gehe zu https://console.hetzner.cloud
2. Wähle deinen Server
3. Öffne "Console" oder "Web Terminal"
4. Führe aus:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
```

**Füge diese Zeile ein:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGiWX6to88GQ65B86WuF9YDl9Dq2YyND07cBI+PEHrDk eddsa-key-20250828
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Option B: Öffentlichen Key anzeigen**

```bash
# Zeige den öffentlichen Key an
cat ~/.ssh/invoice_server_key.pub
```

Kopiere den Output und füge ihn auf dem Server in `~/.ssh/authorized_keys` ein.

### Schritt 4: SSH-Konfiguration erstellen

**Auf deinem Mac:**

```bash
nano ~/.ssh/config
```

**Füge hinzu:**
```
Host invoice-server
    HostName 91.99.211.1
    User root
    IdentityFile ~/.ssh/invoice_server_key
    IdentitiesOnly yes
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

### Schritt 5: Verbindung testen

```bash
# Mit Alias
ssh invoice-server

# Oder direkt
ssh -i ~/.ssh/invoice_server_key root@91.99.211.1
```

**Sollte jetzt ohne Passwort funktionieren!** ✅

---

## Alternative: Direkt mit PuTTY (ohne Konvertierung)

Falls die Konvertierung nicht funktioniert:

```bash
# Installiere PuTTY
brew install putty

# Verbinde direkt mit .ppk Datei
putty -i /Users/craftongmbh/Downloads/n8n_privatekey.ppk root@91.99.211.1
```

---

## Troubleshooting

### "Permission denied (publickey)"

**Prüfe:**
```bash
# Berechtigungen auf Mac
ls -la ~/.ssh/invoice_server_key
# Sollte zeigen: -rw------- (600)

# Prüfe, ob Key auf Server hinzugefügt wurde
ssh -v -i ~/.ssh/invoice_server_key root@91.99.211.1
```

### "puttygen: command not found"

```bash
brew install putty
```

### Key wird nicht akzeptiert

1. Prüfe, ob öffentlicher Key auf Server in `~/.ssh/authorized_keys` ist
2. Prüfe Berechtigungen auf Server: `chmod 600 ~/.ssh/authorized_keys`
3. Prüfe SSH-Logs auf Server: `tail -f /var/log/auth.log`

---

## Schnelllösung: Alles auf einmal

```bash
# 1. PuTTY installieren
brew install putty

# 2. Key konvertieren
mkdir -p ~/.ssh
puttygen /Users/craftongmbh/Downloads/n8n_privatekey.ppk -O private-openssh -o ~/.ssh/invoice_server_key
chmod 600 ~/.ssh/invoice_server_key

# 3. Öffentlichen Key anzeigen
puttygen /Users/craftongmbh/Downloads/n8n_privatekey.ppk -O public-openssh

# 4. Kopiere den Output und füge ihn auf dem Server in ~/.ssh/authorized_keys ein
# (Im Hetzner Cloud Console Web-Terminal)

# 5. Verbinden
ssh -i ~/.ssh/invoice_server_key root@91.99.211.1
```
