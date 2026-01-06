# 🐳 Docker Setup für Invoice Calculator

## Voraussetzungen

- Docker Desktop installiert
- Docker Hub Account (optional, für Image-Push)

## Schnellstart (Lokal)

### 1. Umgebungsvariablen erstellen

Erstelle eine `.env` Datei im Projektverzeichnis:

```bash
# Database (Required)
DATABASE_URL=postgresql://postgres:%5B135Crftn%21Neu%5D@db.lmnocikatjrjzvxfzkcj.supabase.co:5432/postgres

# Supabase Server (Required)
SUPABASE_URL=https://lmnocikatjrjzvxfzkcj.supabase.co
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key

# Supabase Client (Required)
VITE_SUPABASE_URL=https://lmnocikatjrjzvxfzkcj.supabase.co
VITE_SUPABASE_ANON_KEY=dein-anon-key

# Server
NODE_ENV=production
PORT=3000
```

**Wichtig:** 
- Das Passwort muss URL-encoded sein (Sonderzeichen wie `!` → `%21`, `[` → `%5B`, `]` → `%5D`)
- Den Service Role Key findest du im Supabase Dashboard unter **Settings → API**

### 2. Container bauen und starten

```bash
# Mit docker-compose (empfohlen)
docker-compose up -d --build

# Oder manuell
docker build -t invoice-calculator .
docker run -d -p 3000:3000 --env-file .env invoice-calculator
```

### 3. Zugriff

Öffne http://localhost:3000 im Browser.

## Deployment Optionen

### Option A: Docker Hub + Eigener Server

1. **Image zu Docker Hub pushen:**
```bash
# Login
docker login

# Image taggen (ersetze USERNAME mit deinem Docker Hub Username)
docker build -t USERNAME/invoice-calculator:latest .

# Pushen
docker push USERNAME/invoice-calculator:latest
```

2. **Auf Server deployen:**
```bash
# Auf dem Server
docker pull USERNAME/invoice-calculator:latest
docker run -d -p 3000:3000 --env-file .env --name invoice-calculator USERNAME/invoice-calculator:latest
```

### Option B: Railway.app (Einfachste Option)

1. Gehe zu https://railway.app
2. Erstelle ein neues Projekt → "Deploy from GitHub"
3. Verbinde dein Repository
4. Railway erkennt das Dockerfile automatisch
5. Füge die Umgebungsvariablen in Railway hinzu
6. Deploy!

### Option C: Render.com

1. Gehe zu https://render.com
2. Erstelle einen neuen "Web Service"
3. Verbinde dein Repository
4. Wähle "Docker" als Environment
5. Füge die Umgebungsvariablen hinzu
6. Deploy!

### Option D: Fly.io

1. Installiere flyctl: `brew install flyctl`
2. Login: `fly auth login`
3. Launch: `fly launch`
4. Secrets setzen:
```bash
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set SUPABASE_URL="https://..."
fly secrets set SUPABASE_SERVICE_ROLE_KEY="..."
fly secrets set VITE_SUPABASE_URL="https://..."
fly secrets set VITE_SUPABASE_ANON_KEY="..."
```
5. Deploy: `fly deploy`

## Nützliche Befehle

```bash
# Container Logs anzeigen
docker-compose logs -f

# Container stoppen
docker-compose down

# Container neustarten
docker-compose restart

# Shell im Container öffnen
docker-compose exec invoice-calculator sh

# Health Check
curl http://localhost:3000/health
```

## Troubleshooting

### "Cannot connect to database"
- Prüfe, ob DATABASE_URL korrekt ist
- Prüfe, ob Sonderzeichen im Passwort URL-encoded sind
- Prüfe, ob die Supabase-Datenbank erreichbar ist

### "Supabase not configured"
- Prüfe SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY
- Der Service Role Key beginnt mit `eyJ...`

### Container startet nicht
```bash
# Logs prüfen
docker-compose logs

# Container manuell starten für mehr Output
docker-compose up (ohne -d)
```

## HTTPS einrichten (Produktion)

Für Produktion empfehlen wir einen Reverse Proxy wie:
- **Nginx** mit Let's Encrypt
- **Traefik** (automatische SSL-Zertifikate)
- **Cloudflare Tunnel**

Beispiel mit Traefik in docker-compose.yml:

```yaml
services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.email=deine@email.de"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  invoice-calculator:
    build: .
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=Host(`deine-domain.de`)"
      - "traefik.http.routers.app.entrypoints=websecure"
      - "traefik.http.routers.app.tls.certresolver=letsencrypt"
```

