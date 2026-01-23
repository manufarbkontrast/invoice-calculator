# Supabase-Konfiguration für Vercel

## Problem

Wenn Sie den Fehler "Failed to fetch" oder "Supabase ist nicht konfiguriert" sehen, fehlen die Supabase-Umgebungsvariablen in Vercel.

## Lösung: Umgebungsvariablen in Vercel setzen

### 1. Supabase-Credentials finden

Gehen Sie zu Ihrem [Supabase Dashboard](https://app.supabase.com):
1. Wählen Sie Ihr Projekt aus
2. Gehen Sie zu **Settings** → **API**
3. Kopieren Sie:
   - **Project URL** (z.B. `https://xxxxx.supabase.co`)
   - **anon/public key** (beginnt mit `eyJ...`)

### 2. Umgebungsvariablen in Vercel hinzufügen

**Option A: Via Vercel Dashboard**
1. Gehen Sie zu [Vercel Dashboard](https://vercel.com/dashboard)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **Settings** → **Environment Variables**
4. Fügen Sie folgende Variablen hinzu:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Option B: Via Vercel CLI**
```bash
vercel env add VITE_SUPABASE_URL production
# Geben Sie die Supabase URL ein

vercel env add VITE_SUPABASE_ANON_KEY production
# Geben Sie den anon key ein
```

### 3. Deployment neu starten

Nach dem Hinzufügen der Umgebungsvariablen:
```bash
vercel --prod
```

Oder im Vercel Dashboard: **Deployments** → **Redeploy**

## Überprüfung

Nach dem Deployment sollten Sie:
1. Keine "Failed to fetch" Fehler mehr sehen
2. Sich erfolgreich registrieren/anmelden können
3. In der Browser-Console keine Warnungen über fehlende Supabase-Credentials sehen

## Weitere Umgebungsvariablen

Für vollständige Funktionalität benötigen Sie auch:

**Server-seitig (für tRPC/API):**
- `SUPABASE_URL` - Gleiche URL wie oben
- `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (nicht anon key!)
- `DATABASE_URL` - PostgreSQL Connection String

**Stripe (optional, für Zahlungen):**
- `STRIPE_SECRET_KEY` - Stripe Secret Key
- `STRIPE_PRICE_ID_PRO` - Price ID für Pro-Plan
- `STRIPE_PRICE_ID_BUSINESS` - Price ID für Business-Plan
- `STRIPE_WEBHOOK_SECRET` - Webhook Signing Secret

## Troubleshooting

### "Failed to fetch" Fehler
- ✅ Prüfen Sie, ob `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY` gesetzt sind
- ✅ Prüfen Sie, ob die Werte korrekt sind (keine Leerzeichen am Anfang/Ende)
- ✅ Stellen Sie sicher, dass das Deployment nach dem Hinzufügen der Variablen neu gestartet wurde

### CORS-Fehler
- ✅ Prüfen Sie in Supabase Dashboard → Settings → API → CORS
- ✅ Stellen Sie sicher, dass Ihre Vercel-Domain hinzugefügt ist

### "User already registered" Fehler
- ✅ Prüfen Sie in Supabase Dashboard → Authentication → Users
- ✅ Löschen Sie Test-User, falls nötig



