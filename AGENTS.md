# AGENTS – Technischer Überblick

## Projektziel
Invoice-Management App mit React/Vite (Frontend) und Node/Express + tRPC (Backend).

## Architektur (kurz)
- **Frontend:** React + Vite (Client unter `client/`)
- **Backend:** Node/Express + tRPC (Entry: `server/_core/index.ts`)
- **Datenbank:** Supabase self-hosted (Postgres)
- **Reverse Proxy:** Caddy (bereits laufender Stack)

## Umgebungen
### Development (lokal, Mac)
- Start: `pnpm dev`
- Vite läuft als Middleware (HMR)
- `.env` lokal erforderlich
- **Build-Time Variablen:** `VITE_*` (landen im Browser-Bundle)
- **Runtime Secrets:** `SUPABASE_*`, `JWT_SECRET`, `DATABASE_URL`

### Production (Server/Hetzner)
- Deployment über Docker
- Caddy routet:
  - App: `https://invoice.crftn.de` → `invoice-app:3000`
  - Supabase Studio: `https://studio.invoice.crftn.de` → `supabase-studio:3000`
  - Supabase API: `https://sb.invoice.crftn.de` → `supabase-kong:8000`
- Invoice-App Repo: `/var/www/invoice-calculator`
- Supabase Stack: `/var/www/supabase`

## Wichtige Dateien
- App Build/Start: `Dockerfile`
- App Compose: `docker-compose.yml`
- Caddyfile: `/root/n8n-docker-caddy/caddy_config/Caddyfile`
- Supabase Compose: `/var/www/supabase/docker-compose.yml`

## Deploy-Flow (Production)

**Standard Deployment (Code-Updates, Mobile-Optimierungen, etc.):**
```bash
cd /var/www/invoice-calculator
make deploy
```

**Alternative (manuell):**
```bash
cd /var/www/invoice-calculator
./deploy.sh
```

**Weitere Makefile-Befehle:**
```bash
make logs      # Logs in Echtzeit anzeigen
make restart   # Container neu starten (ohne Rebuild)
make migrate   # Datenbank-Migration ausführen
make down      # Container stoppen
make clean     # Alte Images aufräumen
```

**Nur bei Schema-Aenderungen:**
```bash
make migrate
# ODER manuell:
docker compose --profile migrate run --rm invoice-migrate
```

## Supabase
- Start/Restart:
```
cd /var/www/supabase
docker compose up -d
```
- Studio Login ist via **Basic Auth** im Caddyfile gesichert.

## Secrets / Variablen
Invoice `.env` (Server):
- `SUPABASE_URL=https://sb.invoice.crftn.de`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `VITE_SUPABASE_URL=https://sb.invoice.crftn.de`
- `VITE_SUPABASE_ANON_KEY=...`
- `SUPABASE_DB_PASSWORD=...`
- `DATABASE_URL=postgresql://postgres:<PWD>@db:5432/postgres`
- `JWT_SECRET=...`

**Wichtig:** `VITE_*` sind Build-Time.

## Bekannte Stolperfallen
- Docker Build kann RAM-intensiv sein → Server hat Swap (`/swapfile`, 2GB).
- Migrationen **nicht** automatisch bei jedem Deploy ausfuehren.
