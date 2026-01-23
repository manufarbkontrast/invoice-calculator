#!/bin/bash
# Script zum Erstellen der Supabase Storage Buckets
# Wird auf dem Server ausgeführt

cd /var/www/invoice-calculator

# Lade Umgebungsvariablen
source .env 2>/dev/null || export $(cat .env | grep -v '^#' | xargs)

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ Fehler: SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY nicht gefunden in .env"
  exit 1
fi

echo "📦 Erstelle Supabase Storage Buckets..."
echo "URL: $SUPABASE_URL"
echo ""

# Bucket 1: invoices
echo "1️⃣  Erstelle 'invoices' Bucket..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "invoices",
    "public": false,
    "file_size_limit": 52428800,
    "allowed_mime_types": ["application/pdf", "image/*"]
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Bucket 'invoices' erstellt"
elif echo "$BODY" | grep -q "already exists\|duplicate"; then
  echo "ℹ️  Bucket 'invoices' existiert bereits"
else
  echo "❌ Fehler beim Erstellen von 'invoices': HTTP $HTTP_CODE"
  echo "$BODY"
fi

echo ""

# Bucket 2: exports
echo "2️⃣  Erstelle 'exports' Bucket..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "exports",
    "public": false,
    "file_size_limit": 104857600,
    "allowed_mime_types": [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/pdf",
      "application/zip",
      "text/csv"
    ]
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Bucket 'exports' erstellt"
elif echo "$BODY" | grep -q "already exists\|duplicate"; then
  echo "ℹ️  Bucket 'exports' existiert bereits"
else
  echo "❌ Fehler beim Erstellen von 'exports': HTTP $HTTP_CODE"
  echo "$BODY"
fi

echo ""
echo "🔍 Prüfe vorhandene Buckets..."
curl -s -X GET "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" | python3 -m json.tool 2>/dev/null || \
curl -s -X GET "${SUPABASE_URL}/storage/v1/bucket" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}"

echo ""
echo "✅ Fertig!"
