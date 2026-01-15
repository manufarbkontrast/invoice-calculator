# 🌐 DNS-Konfiguration für invoice.crftn.de

## Domain-Informationen

- **Domain:** `invoice.crftn.de`
- **Server-IP:** `91.99.211.1`

---

## Schritt 1: A-Record hinzufügen

In deiner IONOS DNS-Verwaltung:

1. Klicke auf **"Record hinzufügen"** (oben links)

2. Wähle **"A"** als Typ

3. Fülle die Felder aus:
   - **HOSTNAME:** `invoice` (oder leer lassen für die Hauptdomain)
   - **WERT:** `91.99.211.1`
   - **TTL:** 3600 (oder Standard)

4. Klicke auf **"Speichern"** oder **"Hinzufügen"**

---

## Schritt 2: Optional - www-Subdomain hinzufügen

Falls du auch `www.invoice.crftn.de` unterstützen möchtest:

1. Klicke auf **"Record hinzufügen"**
2. Wähle **"A"** als Typ
3. Fülle aus:
   - **HOSTNAME:** `www.invoice`
   - **WERT:** `91.99.211.1`
4. Speichern

**Oder:** Verwende einen CNAME-Record:
- **TYP:** CNAME
- **HOSTNAME:** `www.invoice`
- **WERT:** `invoice.crftn.de`

---

## Schritt 3: DNS-Propagierung prüfen

Nach dem Hinzufügen des A-Records, warte 5-15 Minuten, dann prüfe:

```bash
# Auf deinem Mac:
nslookup invoice.crftn.de
# oder
dig invoice.crftn.de

# Sollte zeigen: 91.99.211.1
```

---

## Schritt 4: Nginx-Konfiguration anpassen

**Auf dem Server** (im Web-Terminal oder per SSH):

```bash
nano /etc/nginx/sites-available/invoice-calculator
```

**Ersetze:**
```
server_name deine-domain.de www.deine-domain.de;
```

**Mit:**
```
server_name invoice.crftn.de www.invoice.crftn.de;
```

**Speichern:** `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Testen
nginx -t

# Neu starten
systemctl restart nginx
```

---

## Schritt 5: SSL-Zertifikat einrichten (optional, empfohlen)

**Auf dem Server:**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d invoice.crftn.de -d www.invoice.crftn.de
```

---

## ✅ Fertig!

Nach der DNS-Propagierung sollte deine Anwendung unter erreichbar sein:
- `http://invoice.crftn.de`
- `https://invoice.crftn.de` (nach SSL-Setup)

---

## 🔍 Troubleshooting

### DNS zeigt noch alte IP
- Warte länger (bis zu 24 Stunden bei manchen Providern)
- Prüfe mit: `nslookup invoice.crftn.de`

### Domain funktioniert nicht
```bash
# Prüfe Nginx-Status
systemctl status nginx

# Prüfe Service-Status
systemctl status invoice-calculator

# Prüfe Nginx-Logs
tail -f /var/log/nginx/error.log
```

### SSL funktioniert nicht
```bash
# Prüfe Zertifikat
certbot certificates

# Erneuere Zertifikat
certbot renew
```
