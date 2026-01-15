# 🔧 SSH-Verbindungsprobleme lösen

## Problem: Passwort funktioniert nicht

Wenn das Passwort nicht funktioniert, gibt es mehrere Lösungen:

---

## Lösung 1: Hetzner Cloud Console (Web-Terminal) ⭐ EMPFOHLEN

**Das ist die einfachste Methode!**

1. Gehe zu https://console.hetzner.cloud
2. Logge dich ein
3. Klicke auf deinen Server "CX23 manuserver"
4. Klicke auf den Tab **"Console"** oder **"Web Terminal"**
5. Du bist jetzt direkt auf dem Server! ✅

**Vorteil:** Keine SSH-Verbindung nötig, funktioniert immer!

---

## Lösung 2: SSH-Key einrichten (für zukünftige Verbindungen)

### Schritt 1: SSH-Key auf deinem Mac erstellen

```bash
# Prüfe, ob bereits ein Key existiert
ls -la ~/.ssh/id_rsa.pub

# Falls nicht, erstelle einen neuen
ssh-keygen -t rsa -b 4096 -C "deine-email@example.com"
# Drücke Enter für alle Fragen (oder gib einen Passphrase ein)
```

### Schritt 2: Öffentlichen Key anzeigen

```bash
cat ~/.ssh/id_rsa.pub
```

**Kopiere den gesamten Output** (beginnt mit `ssh-rsa ...`)

### Schritt 3: Key in Hetzner Cloud Console hinzufügen

1. Gehe zu https://console.hetzner.cloud
2. Klicke auf deinen Server
3. Gehe zu **"SSH Keys"** oder **"Access"**
4. Klicke auf **"Add SSH Key"**
5. Füge den kopierten Key ein
6. Speichere

**Oder manuell auf dem Server:**

Verwende das **Web-Terminal** (Lösung 1) und führe aus:

```bash
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Füge hier deinen öffentlichen Key ein (aus cat ~/.ssh/id_rsa.pub)
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Schritt 4: Testen

```bash
ssh root@91.99.211.1
# Sollte jetzt ohne Passwort funktionieren!
```

---

## Lösung 3: Passwort in Hetzner Cloud Console zurücksetzen

1. Gehe zu https://console.hetzner.cloud
2. Klicke auf deinen Server "CX23 manuserver"
3. Gehe zu **"Rescue"** Tab
4. Aktiviere **"Enable Rescue System"**
5. Wähle **"Linux 64bit"**
6. Klicke auf **"Enable Rescue & Power Cycle"**
7. Warte 1-2 Minuten
8. Verbinde dich mit dem **Web-Terminal** (Lösung 1)
9. Setze neues Passwort:

```bash
passwd root
# Gib neues Passwort ein (2x)
```

10. Gehe zurück zu **"Rescue"** Tab
11. Klicke auf **"Disable Rescue & Power Cycle"**
12. Server startet neu mit normalem System

---

## Lösung 4: Anderen Benutzer verwenden

Möglicherweise ist SSH für `root` deaktiviert. Versuche:

```bash
# Prüfe, welche Benutzer existieren
ssh admin@91.99.211.1
# oder
ssh ubuntu@91.99.211.1
# oder
ssh debian@91.99.211.1
```

---

## Lösung 5: SSH-Konfiguration prüfen

Auf deinem Mac:

```bash
# Prüfe SSH-Konfiguration
cat ~/.ssh/config

# Versuche mit verbose Output
ssh -v root@91.99.211.1
```

Das zeigt dir, was genau schiefgeht.

---

## ⭐ EMPFOHLENE LÖSUNG: Web-Terminal verwenden

**Für jetzt:** Verwende einfach das **Web-Terminal in der Hetzner Cloud Console**!

1. Gehe zu https://console.hetzner.cloud
2. Server → "CX23 manuserver"
3. Tab **"Console"** oder **"Web Terminal"**
4. Fertig! Du bist auf dem Server!

Dann kannst du alle Befehle direkt dort ausführen, ohne SSH-Probleme!

---

## Nächste Schritte (mit Web-Terminal)

Sobald du im Web-Terminal bist:

```bash
# System aktualisieren
apt update && apt upgrade -y

# Node.js installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Nginx installieren
apt install -y nginx git

# pnpm installieren
npm install -g pnpm

# Projekt-Verzeichnis erstellen
mkdir -p /var/www/invoice-calculator
```

Dann kannst du das Projekt mit einem der Upload-Methoden hochladen (siehe nächste Schritte).

---

## Projekt hochladen (ohne SSH-Passwort)

### Option A: Mit Hetzner Cloud Console File Manager

1. In der Hetzner Cloud Console
2. Server → "Volumes" oder "Storage"
3. Dateien hochladen (falls verfügbar)

### Option B: Git verwenden

Wenn dein Projekt in einem Git-Repo ist:

```bash
# Im Web-Terminal auf dem Server:
cd /var/www/invoice-calculator
git clone <dein-repo-url> .
```

### Option C: Dateien manuell kopieren

1. Erstelle auf deinem Mac ein ZIP-Archiv:
```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
zip -r invoice-calculator.zip . -x "node_modules/*" ".git/*" "dist/*"
```

2. Lade es in der Hetzner Cloud Console hoch (falls möglich)
3. Oder verwende einen anderen Upload-Service

---

## Zusammenfassung

**Für jetzt:**
1. ✅ Verwende **Hetzner Cloud Console Web-Terminal** (Lösung 1)
2. ✅ Führe die Server-Setup-Befehle dort aus
3. ✅ Lade Projekt mit Git hoch (Option B) oder manuell

**Für später:**
- Richte SSH-Keys ein (Lösung 2) für einfachere Verbindungen
