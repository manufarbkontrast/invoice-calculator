# Upload-Fehler Behebung

## Problem: "Server returned non-JSON response (500): A server error has occurred"

Dieser Fehler tritt auf, wenn der Server einen 500-Fehler zurückgibt und HTML statt JSON sendet.

## Mögliche Ursachen und Lösungen

### 1. Supabase Storage Bucket fehlt

**Symptom:** Fehler beim Upload, "Bucket not found" in den Logs

**Lösung:**
1. Gehen Sie zu [Supabase Dashboard](https://app.supabase.com)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **Storage**
4. Erstellen Sie einen neuen Bucket namens `invoices`
5. Stellen Sie sicher, dass der Bucket **öffentlich** ist (für öffentliche URLs) oder konfigurieren Sie Storage Policies

### 2. Supabase Service Role Key fehlt

**Symptom:** "Supabase Storage ist nicht konfiguriert"

**Lösung:**
1. Gehen Sie zu [Supabase Dashboard](https://app.supabase.com) → **Settings** → **API**
2. Kopieren Sie den **service_role key** (NICHT der anon key!)
3. Fügen Sie ihn in Vercel als Umgebungsvariable hinzu:
   ```bash
   vercel env add SUPABASE_SERVICE_ROLE_KEY production
   ```
4. Deployment neu starten

### 3. Datenbank-Verbindung fehlt

**Symptom:** Fehler beim Erstellen der Invoice in der Datenbank

**Lösung:**
1. Prüfen Sie, ob `DATABASE_URL` in Vercel gesetzt ist
2. Die URL sollte im Format sein: `postgresql://user:password@host:port/database`
3. Deployment neu starten

### 4. Row-Level Security (RLS) aktiviert

**Symptom:** "new row violates row-level security"

**Lösung:**
1. Gehen Sie zu Supabase Dashboard → **Storage** → **Policies**
2. Für den `invoices` Bucket:
   - Entweder RLS deaktivieren (für Service Role Key)
   - Oder eine Policy erstellen, die Service Role Key erlaubt

### 5. Subscription-Limit erreicht

**Symptom:** "Sie haben Ihr monatliches Limit von 5 Rechnungen erreicht"

**Lösung:**
- Upgrade auf Pro-Plan für unbegrenzte Uploads
- Oder warten bis zum nächsten Monat (Limit wird automatisch zurückgesetzt)

## Diagnose-Schritte

### 1. Umgebungsvariablen prüfen

```bash
vercel env ls
```

Stellen Sie sicher, dass folgende Variablen gesetzt sind:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `VITE_SUPABASE_URL` (für Client)
- `VITE_SUPABASE_ANON_KEY` (für Client)

### 2. Supabase Storage Bucket prüfen

1. Gehen Sie zu Supabase Dashboard → **Storage**
2. Prüfen Sie, ob der Bucket `invoices` existiert
3. Prüfen Sie die Bucket-Einstellungen:
   - **Public bucket**: Sollte aktiviert sein für öffentliche URLs
   - **File size limit**: Sollte mindestens 16MB sein
   - **Allowed MIME types**: Sollte `application/pdf` und Bildformate enthalten

### 3. Browser Console prüfen

Öffnen Sie Chrome Dev Tools (F12) → **Console**:
- Prüfen Sie auf Fehlermeldungen
- Prüfen Sie Network-Tab für fehlgeschlagene Requests

### 4. Vercel Logs prüfen

Im Vercel Dashboard:
1. Gehen Sie zu **Deployments**
2. Wählen Sie das neueste Deployment
3. Klicken Sie auf **Functions** → **View Function Logs**
4. Suchen Sie nach `[Upload]` oder `[Supabase Storage]` Logs

## Häufige Fehlermeldungen

### "Supabase Storage ist nicht konfiguriert"
→ `SUPABASE_SERVICE_ROLE_KEY` fehlt oder ist falsch

### "Bucket not found" oder "does not exist"
→ Bucket `invoices` existiert nicht in Supabase

### "new row violates row-level security"
→ RLS ist aktiviert, aber keine Policy erlaubt Service Role Key

### "Datenbank-Fehler beim Erstellen der Rechnung"
→ `DATABASE_URL` fehlt oder ist falsch, oder Datenbank-Schema ist nicht aktuell

### "Upload-Limit erreicht"
→ Free-Plan Limit von 5 Rechnungen/Monat erreicht

## Test nach Behebung

1. Gehen Sie zu https://invoice-calculator-med913x22-manufarbkontrasts-projects.vercel.app/dashboard
2. Melden Sie sich an
3. Versuchen Sie, eine PDF-Datei hochzuladen
4. Prüfen Sie die Browser Console auf Fehler
5. Prüfen Sie, ob die Rechnung in der Liste erscheint

## Neue Deployment-URL

**https://invoice-calculator-med913x22-manufarbkontrasts-projects.vercel.app**

Die verbesserte Fehlerbehandlung sollte jetzt klarere Fehlermeldungen anzeigen, die helfen, das Problem zu identifizieren.

