# 🤖 Vollautomatisches Supabase Setup

Dieses Skript erledigt **alles automatisch** für dich!

## ✅ Was wird automatisch gemacht:

1. ✅ **Database Setup** - Alle Tabellen, Enums, Indizes, RLS Policies
2. ✅ **Storage Buckets** - Erstellt `invoices` und `exports` Buckets
3. ✅ **Storage Policies** - Setzt alle notwendigen Policies
4. ✅ **Verifizierung** - Prüft ob alles korrekt eingerichtet ist

## 🚀 So führst du es aus:

### Schritt 1: Stelle sicher, dass deine .env Datei die folgenden Variablen enthält:

```bash
SUPABASE_URL=https://lmnocikatjrjzvxfzkcj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
DATABASE_URL=postgresql://postgres:password@db.lmnocikatjrjzvxfzkcj.supabase.co:5432/postgres
```

**Wichtig:** 
- `SUPABASE_SERVICE_ROLE_KEY` findest du im Dashboard unter: **Settings → API → service_role key**
- `DATABASE_URL` findest du im Dashboard unter: **Settings → Database → Connection string → URI**

### Schritt 2: Führe das Skript aus:

```bash
npm run supabase:setup
```

Das war's! 🎉

## 📋 Was passiert:

1. Das Skript liest die SQL-Dateien (`supabase-setup.sql` und `supabase-storage-policies.sql`)
2. Führt alle SQL-Befehle direkt in deiner Datenbank aus
3. Erstellt die Storage Buckets über die Supabase API
4. Setzt die Storage Policies
5. Verifiziert, dass alles korrekt eingerichtet ist

## ⚠️ Manuelle Schritte (nur Auth-Konfiguration):

Nach dem automatischen Setup musst du nur noch **eine Sache** manuell machen:

1. Gehe zu **Authentication → URL Configuration** im Supabase Dashboard
2. Setze **Site URL:** `https://invoice-calculator-ashen.vercel.app`
3. Füge **Redirect URLs** hinzu:
   - `https://invoice-calculator-ashen.vercel.app/**`
   - `https://invoice-calculator-ashen.vercel.app/auth`
   - `https://invoice-calculator-ashen.vercel.app/auth/callback`

## 🔍 Verifizierung:

Nach dem Setup kannst du prüfen:

```bash
npm run supabase:check
```

## ❌ Fehlerbehebung:

### "SUPABASE_URL nicht gefunden"
- Stelle sicher, dass deine `.env` Datei im Projekt-Root liegt
- Prüfe, dass die Variablen korrekt geschrieben sind

### "Bucket konnte nicht erstellt werden"
- Das Skript versucht es automatisch, aber falls es fehlschlägt:
- Erstelle die Buckets manuell im Dashboard (siehe `SUPABASE-SETUP.md`)

### "SQL Fehler"
- Die meisten "already exists" Fehler sind normal (idempotent)
- Bei anderen Fehlern: Prüfe die Fehlermeldung

## 🎯 Zusammenfassung:

1. ✅ Setze `.env` Variablen
2. ✅ Führe `npm run supabase:setup` aus
3. ✅ Konfiguriere Auth URLs im Dashboard (1x manuell)
4. ✅ Fertig! 🎉

---

**Tipp:** Das Skript ist idempotent - du kannst es mehrfach ausführen ohne Probleme!

