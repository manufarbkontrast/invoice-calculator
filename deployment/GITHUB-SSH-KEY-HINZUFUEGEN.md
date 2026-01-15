# 🔑 SSH-Key zu GitHub hinzufügen

## ✅ Was bereits erledigt ist:

- ✅ PPK-Key wurde in OpenSSH-Format konvertiert
- ✅ SSH-Config wurde eingerichtet
- ✅ Git Remote wurde auf SSH umgestellt

## 📝 Jetzt: Öffentlichen Key zu GitHub hinzufügen

### Dein öffentlicher SSH-Key:

```
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIFZDjOapfl9OMA+28xdSXPTkMB8eQkZCOnqHsAoqi4EP dr@crftn.de
```

### Schritt-für-Schritt:

1. **Gehe zu:** https://github.com/settings/keys
2. **Klicke auf:** "New SSH key"
3. **Title:** z.B. "Mac - Invoice Calculator"
4. **Key type:** Authentication Key (Standard)
5. **Key:** Füge den obigen Key ein (alles von `ssh-ed25519` bis `dr@crftn.de`)
6. **Klicke auf:** "Add SSH key"

### Alternative: Key anzeigen lassen

Falls du den Key nochmal anzeigen möchtest:

```bash
cat ~/.ssh/github_key.pub
```

---

## ✅ Nach dem Hinzufügen: Push versuchen

```bash
cd /Users/craftongmbh/Downloads/invoice-calculator
git push -u origin main
```

Das sollte jetzt ohne Passwort funktionieren! 🎉

---

## 🆘 Falls es nicht funktioniert:

### "Permission denied (publickey)"

- Prüfe, ob der Key wirklich zu GitHub hinzugefügt wurde
- Prüfe, ob du Zugriff auf das Repository `manufarbkontrast/invoice-calculator` hast
- Teste die Verbindung: `ssh -T git@github.com`

### "Repository not found"

- Prüfe, ob das Repository existiert: https://github.com/manufarbkontrast/invoice-calculator
- Prüfe, ob du Zugriff darauf hast
