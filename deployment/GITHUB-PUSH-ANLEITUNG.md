# 🔐 GitHub Push - Authentifizierung einrichten

## Problem
Git kann nicht automatisch authentifizieren. Du musst dich einmalig mit einem Personal Access Token authentifizieren.

---

## ✅ Lösung: Personal Access Token erstellen

### Schritt 1: Token auf GitHub erstellen

1. **Gehe zu:** https://github.com/settings/tokens
2. **Klicke auf:** "Generate new token" → "Generate new token (classic)"
3. **Token-Name:** z.B. "Invoice Calculator Deployment"
4. **Ablauf:** Wähle eine Dauer (z.B. 90 Tage oder "No expiration")
5. **Berechtigungen:** Aktiviere `repo` (vollständiger Zugriff auf private Repositories)
6. **Klicke auf:** "Generate token"
7. **WICHTIG:** Kopiere den Token sofort! (wird nur einmal angezeigt)

### Schritt 2: Token verwenden

**Im Terminal auf deinem Mac:**

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator

# Versuche Push - wenn nach Passwort gefragt wird:
git push -u origin main
```

**Wenn nach Benutzername gefragt wird:**
- **Benutzername:** `manufarbkontrast`
- **Passwort:** Füge dein **Personal Access Token** ein (nicht dein GitHub-Passwort!)

---

## 🔄 Alternative: Mit GitHub CLI

Falls du GitHub CLI verwenden möchtest:

```bash
# Bei GitHub anmelden
gh auth login

# Dann Push
git push -u origin main
```

---

## ✅ Nach erfolgreichem Push

Das Projekt ist jetzt auf GitHub! Du kannst es auf dem Server klonen:

```bash
# Im Hetzner Web-Terminal:
cd /var/www/invoice-calculator
git clone https://github.com/manufarbkontrast/invoice-calculator.git .
```

---

## 🆘 Hilfe

### "Permission denied"
- Prüfe, ob der Token die `repo`-Berechtigung hat
- Prüfe, ob du Zugriff auf das Repository `manufarbkontrast/invoice-calculator` hast

### "Repository not found"
- Prüfe, ob das Repository existiert: https://github.com/manufarbkontrast/invoice-calculator
- Prüfe, ob du Zugriff darauf hast

### Token funktioniert nicht
- Erstelle einen neuen Token
- Stelle sicher, dass `repo` aktiviert ist
- Prüfe, ob der Token nicht abgelaufen ist
