# 🔑 SSH-Key Setup für invoice-calculator

## Dein SSH-Key

Du hast einen PuTTY Private Key (`.ppk` Format). Für SSH auf Mac/Linux brauchst du das OpenSSH-Format.

---

## Lösung: Key konvertieren

### Schritt 1: PuTTY Key zu OpenSSH konvertieren

**Auf deinem Mac:**

```bash
# Prüfe, ob puttygen installiert ist
which puttygen

# Falls nicht, installiere es:
brew install putty
```

**Dann konvertiere:**

```bash
# Konvertiere .ppk zu OpenSSH Format
puttygen /Users/craftongmbh/Downloads/n8n_privatekey.ppk -O private-openssh -o ~/.ssh/invoice_calculator_key

# Setze die richtigen Berechtigungen
chmod 600 ~/.ssh/invoice_calculator_key
```

### Schritt 2: Öffentlichen Key extrahieren

```bash
# Extrahiere den öffentlichen Key
puttygen /Users/craftongmbh/Downloads/n8n_privatekey.ppk -O public-openssh -o ~/.ssh/invoice_calculator_key.pub

# Zeige den öffentlichen Key an
cat ~/.ssh/invoice_calculator_key.pub
```

**Der öffentliche Key ist:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGiWX6to88GQ65B86WuF9YDl9Dq2YyND07cBI+PEHrDk eddsa-key-20250828
```

---

## Schritt 3: Öffentlichen Key auf Server hinzufügen

### Option A: Mit Hetzner Cloud Console

1. Gehe zu https://console.hetzner.cloud
2. Wähle deinen Server
3. Gehe zu **"SSH Keys"** oder **"Access"**
4. Klicke auf **"Add SSH Key"**
5. Füge diesen Key ein:
   ```
   ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGiWX6to88GQ65B86WuF9YDl9Dq2YyND07cBI+PEHrDk eddsa-key-20250828
   ```

### Option B: Manuell auf Server

**Im Web-Terminal auf dem Server:**

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

---

## Schritt 4: SSH-Konfiguration auf Mac

**Auf deinem Mac:**

```bash
nano ~/.ssh/config
```

**Füge hinzu:**
```
Host invoice-server
    HostName 91.99.211.1
    User root
    IdentityFile ~/.ssh/invoice_calculator_key
    IdentitiesOnly yes
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

## Schritt 5: Verbindung testen

**Auf deinem Mac:**

```bash
# Mit Key verbinden
ssh invoice-server

# Oder direkt:
ssh -i ~/.ssh/invoice_calculator_key root@91.99.211.1
```

**Sollte jetzt ohne Passwort funktionieren!** ✅

---

## Alternative: Ohne Konvertierung (mit PuTTY auf Mac)

Falls du PuTTY auf Mac verwendest, kannst du den `.ppk` Key direkt verwenden:

```bash
# Installiere PuTTY
brew install putty

# Verbinde mit PuTTY
putty -i /Users/craftongmbh/Downloads/n8n_privatekey.ppk root@91.99.211.1
```

---

## Schnelllösung: Öffentlichen Key direkt verwenden

Falls die Konvertierung nicht funktioniert, kannst du den öffentlichen Key direkt verwenden:

**Öffentlicher Key:**
```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIGiWX6to88GQ65B86WuF9YDl9Dq2YyND07cBI+PEHrDk eddsa-key-20250828
```

**Füge diesen auf dem Server in `~/.ssh/authorized_keys` hinzu** (siehe Schritt 3).

---

## Troubleshooting

### Key wird nicht akzeptiert
```bash
# Prüfe Berechtigungen
ls -la ~/.ssh/invoice_calculator_key
# Sollte zeigen: -rw------- (600)

# Prüfe SSH-Verbindung mit verbose Output
ssh -v -i ~/.ssh/invoice_calculator_key root@91.99.211.1
```

### PuTTY nicht installiert
```bash
brew install putty
```

### Key-Format-Fehler
```bash
# Versuche mit ssh-keygen zu konvertieren (falls möglich)
ssh-keygen -i -f /Users/craftongmbh/Downloads/n8n_privatekey.ppk > ~/.ssh/invoice_calculator_key
```
