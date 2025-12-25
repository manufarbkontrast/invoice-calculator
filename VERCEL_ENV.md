# Vercel Umgebungsvariablen

Diese Datei listet alle benötigten Umgebungsvariablen für das Vercel-Deployment auf.

## Erforderliche Variablen (Production)

### Datenbank
- `DATABASE_URL` - PostgreSQL Verbindungsstring (z.B. `postgresql://user:password@host:port/database`)

### Supabase (Server)
- `SUPABASE_URL` - Deine Supabase Projekt-URL
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase Service Role Key (für Admin-Operationen)

### Supabase (Client - mit VITE_ Prefix)
- `VITE_SUPABASE_URL` - Deine Supabase Projekt-URL (gleiche wie oben)
- `VITE_SUPABASE_ANON_KEY` - Supabase Anonymous Key (für Client-seitige Operationen)

### Authentication
- `JWT_SECRET` - Geheimer Schlüssel für JWT-Token (sollte ein sicherer, zufälliger String sein)

## Optionale Variablen

### OAuth (falls verwendet)
- `OAUTH_SERVER_URL` - URL des OAuth-Servers
- `OWNER_OPEN_ID` - OpenID des Projektbesitzers
- `VITE_APP_ID` - App-ID für OAuth

### AI/LLM (falls verwendet)
- `OPENAI_API_KEY` - OpenAI API Key
- `BUILT_IN_FORGE_API_URL` - Forge API URL (optional)
- `BUILT_IN_FORGE_API_KEY` - Forge API Key (optional, kann OPENAI_API_KEY verwenden)

## Vercel CLI Befehle zum Setzen

```bash
# Datenbank
vercel env add DATABASE_URL production

# Supabase Server
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Supabase Client (mit VITE_ Prefix)
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production

# Authentication
vercel env add JWT_SECRET production

# Optional: OAuth
vercel env add OAUTH_SERVER_URL production
vercel env add OWNER_OPEN_ID production
vercel env add VITE_APP_ID production

# Optional: AI
vercel env add OPENAI_API_KEY production
```

## Wichtig

- Variablen mit `VITE_` Prefix werden auch im Client-Bundle verfügbar sein
- Variablen ohne `VITE_` Prefix sind nur server-seitig verfügbar
- Nach dem Setzen der Variablen muss ein neues Deployment erstellt werden

