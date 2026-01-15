# 📋 Server-Informationen

## Aktuelle Server-Daten

- **Server-IP:** `91.99.211.1`
- **Server-User:** `root`
- **Projekt-Pfad:** `/var/www/invoice-calculator`

## Schnellverbindung

```bash
ssh root@91.99.211.1
```

## DNS-Konfiguration

**Domain:** `invoice.crftn.de`

Bei deinem Domain-Provider (IONOS) einen **A-Record** erstellen:

- **Typ:** A
- **HOSTNAME:** `invoice`
- **Wert:** `91.99.211.1`
- **TTL:** 3600 (oder automatisch)

Siehe `deployment/DNS-SETUP.md` für detaillierte Anleitung.

## Web-Terminal

1. Gehe zu https://console.hetzner.cloud
2. Wähle deinen Server
3. Klicke auf "Console" oder "Web Terminal"

## Nützliche Befehle

### Verbindung testen
```bash
ping 91.99.211.1
ssh root@91.99.211.1
```

### Service-Status prüfen
```bash
ssh root@91.99.211.1 'systemctl status invoice-calculator'
```

### Logs ansehen
```bash
ssh root@91.99.211.1 'journalctl -u invoice-calculator -f'
```
