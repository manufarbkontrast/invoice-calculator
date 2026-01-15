#!/bin/bash

# Deployment-Skript für invoice-calculator
# Verwendung: ./deploy.sh

set -e  # Bei Fehler abbrechen

echo "🚀 Starte Deployment..."

# Prüfe, ob wir im richtigen Verzeichnis sind
if [ ! -f "package.json" ]; then
    echo "❌ Fehler: package.json nicht gefunden. Bist du im Projektverzeichnis?"
    exit 1
fi

# Prüfe, ob .env existiert
if [ ! -f ".env" ]; then
    echo "⚠️  Warnung: .env-Datei nicht gefunden!"
    echo "📝 Erstelle .env aus .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ .env erstellt. Bitte fülle die Werte aus!"
        exit 1
    else
        echo "❌ .env.example nicht gefunden!"
        exit 1
    fi
fi

echo "📦 Installiere Dependencies..."
pnpm install  # oder npm install

echo "🔨 Baue Projekt..."
pnpm run build  # oder npm run build

echo "🔄 Starte Service neu..."
sudo systemctl restart invoice-calculator

echo "✅ Deployment abgeschlossen!"
echo "📊 Status prüfen mit: sudo systemctl status invoice-calculator"
