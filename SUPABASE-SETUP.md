# Supabase Setup Anleitung

Diese Anleitung führt Sie durch die komplette Supabase-Konfiguration für das Invoice Calculator Projekt.

## 📋 Übersicht

1. ✅ Database Tables & Enums erstellen
2. ✅ Row Level Security (RLS) aktivieren
3. ✅ Storage Buckets erstellen
4. ✅ Storage Policies konfigurieren
5. ✅ Auth-Konfiguration

---

## 1. Database Setup

### Schritt 1: SQL-Skript ausführen

1. Öffnen Sie das [Supabase Dashboard](https://supabase.com/dashboard)
2. Wählen Sie Ihr Projekt aus
3. Gehen Sie zu **SQL Editor** → **New Query**
4. Öffnen Sie die Datei `supabase-setup.sql` aus diesem Projekt
5. Kopieren Sie den gesamten Inhalt
6. Fügen Sie ihn in den SQL Editor ein
7. Klicken Sie auf **Run** (oder drücken Sie `Ctrl/Cmd + Enter`)

Das Skript erstellt:
- ✅ Alle benötigten Enums (`user_role`, `invoice_status`, `payment_status`, `team_role`)
- ✅ Alle Tabellen (`users`, `projects`, `invoices`, `teams`, `team_members`, `team_invitations`)
- ✅ Performance-Indizes
- ✅ Row Level Security (RLS) Policies
- ✅ Automatische `updated_at` Trigger

**Wichtig:** Das Skript ist idempotent - Sie können es mehrfach ausführen, ohne Fehler zu bekommen.

---

## 2. Storage Buckets erstellen

### Schritt 1: Bucket "invoices" erstellen

1. Gehen Sie zu **Storage** → **Buckets**
2. Klicken Sie auf **New Bucket**
3. Konfigurieren Sie:
   - **Name:** `invoices`
   - **Public bucket:** ❌ Nein (aus)
   - **File size limit:** `50` MB
   - **Allowed MIME types:** `application/pdf,image/*`
4. Klicken Sie auf **Create bucket**

### Schritt 2: Bucket "exports" erstellen

1. Klicken Sie erneut auf **New Bucket**
2. Konfigurieren Sie:
   - **Name:** `exports`
   - **Public bucket:** ❌ Nein (aus)
   - **File size limit:** `100` MB
   - **Allowed MIME types:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,application/zip,text/csv`
3. Klicken Sie auf **Create bucket**

---

## 3. Storage Policies konfigurieren

### Schritt 1: Storage Policies SQL ausführen

1. Gehen Sie zu **SQL Editor** → **New Query**
2. Öffnen Sie die Datei `supabase-storage-policies.sql` aus diesem Projekt
3. Kopieren Sie den gesamten Inhalt
4. Fügen Sie ihn in den SQL Editor ein
5. Klicken Sie auf **Run**

Das Skript erstellt Policies für:
- ✅ Upload von Dateien in den eigenen Ordner
- ✅ Lesen der eigenen Dateien
- ✅ Löschen der eigenen Dateien

**Wichtig:** Die Policies stellen sicher, dass Benutzer nur auf ihre eigenen Dateien zugreifen können (organisiert nach `user_id`).

---

## 4. Auth-Konfiguration

### Schritt 1: Site URL setzen

1. Gehen Sie zu **Authentication** → **URL Configuration**
2. Setzen Sie die **Site URL:**
   ```
   https://invoice-calculator-ashen.vercel.app
   ```

### Schritt 2: Redirect URLs hinzufügen

Fügen Sie unter **Redirect URLs** folgende URLs hinzu:
- `https://invoice-calculator-ashen.vercel.app/**`
- `https://invoice-calculator-ashen.vercel.app/auth`
- `https://invoice-calculator-ashen.vercel.app/auth/callback`

Klicken Sie nach jeder URL auf **Add URL**.

---

## 5. Verifizierung

### Database prüfen

1. Gehen Sie zu **Table Editor**
2. Überprüfen Sie, dass folgende Tabellen existieren:
   - ✅ `users`
   - ✅ `projects`
   - ✅ `invoices`
   - ✅ `teams`
   - ✅ `team_members`
   - ✅ `team_invitations`

### Storage prüfen

1. Gehen Sie zu **Storage** → **Buckets**
2. Überprüfen Sie, dass beide Buckets existieren:
   - ✅ `invoices`
   - ✅ `exports`

### RLS prüfen

1. Gehen Sie zu **Table Editor**
2. Wählen Sie eine Tabelle aus (z.B. `invoices`)
3. Überprüfen Sie, dass **RLS enabled** angezeigt wird
4. Klicken Sie auf **Policies** um die erstellten Policies zu sehen

---

## 🔧 Troubleshooting

### Problem: "relation already exists"

**Lösung:** Das ist normal - das Skript verwendet `CREATE TABLE IF NOT EXISTS` und ist idempotent. Sie können es sicher erneut ausführen.

### Problem: "policy already exists"

**Lösung:** Das Skript verwendet `DROP POLICY IF EXISTS` vor dem Erstellen. Führen Sie das Skript erneut aus.

### Problem: Storage Upload funktioniert nicht

**Lösung:** 
1. Überprüfen Sie, ob die Storage Buckets erstellt wurden
2. Überprüfen Sie, ob die Storage Policies ausgeführt wurden
3. Überprüfen Sie, ob der Benutzer authentifiziert ist

### Problem: RLS blockiert Zugriff

**Lösung:**
1. Überprüfen Sie, ob RLS aktiviert ist: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Überprüfen Sie, ob die Policies korrekt erstellt wurden
3. Überprüfen Sie, ob `auth.uid()` den korrekten User zurückgibt

---

## 📝 Nächste Schritte

Nach dem Setup:

1. ✅ Testen Sie die Registrierung eines neuen Benutzers
2. ✅ Testen Sie den Upload einer Rechnung
3. ✅ Überprüfen Sie, dass die Daten in den Tabellen erscheinen
4. ✅ Überprüfen Sie, dass die Dateien im Storage Bucket landen

---

## 🔗 Nützliche Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)

---

**Fertig!** 🎉 Ihre Supabase-Konfiguration ist jetzt vollständig eingerichtet.



