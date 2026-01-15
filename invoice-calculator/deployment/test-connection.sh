#!/bin/bash

# Test-Skript für SSH-Verbindung

echo "Teste SSH-Verbindung..."
echo ""

# Versuche direkte Verbindung
ssh -v root@91.99.211.1 "echo 'Verbindung erfolgreich!'" 2>&1 | head -20

echo ""
echo "Falls die Verbindung fehlschlägt:"
echo "1. Prüfe das Passwort in der Hetzner Cloud Console"
echo "2. Prüfe, ob SSH-Keys konfiguriert sind"
echo "3. Versuche: ssh root@91.99.211.1"
