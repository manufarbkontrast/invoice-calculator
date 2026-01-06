# 🚀 Quick Start: Supabase Setup

## Schnellstart (5 Minuten)

### 1. Database Setup (2 Minuten)

1. Öffne [Supabase Dashboard](https://supabase.com/dashboard) → Dein Projekt
2. Gehe zu **SQL Editor** → **New Query**
3. Öffne die Datei `supabase-setup.sql` und kopiere den gesamten Inhalt
4. Füge ihn in den SQL Editor ein und klicke auf **Run**

✅ **Fertig!** Alle Tabellen, Enums und Policies sind jetzt erstellt.

---

### 2. Storage Buckets (2 Minuten)

1. Gehe zu **Storage** → **Buckets** → **New Bucket**

**Bucket 1: `invoices`**
- Name: `invoices`
- Public: ❌ Nein
- File size limit: `50` MB
- MIME types: `application/pdf,image/*`

**Bucket 2: `exports`**
- Name: `exports`
- Public: ❌ Nein
- File size limit: `100` MB
- MIME types: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/pdf,application/zip,text/csv`

✅ **Fertig!** Beide Buckets sind erstellt.

---

### 3. Storage Policies (1 Minute)

1. Gehe zu **SQL Editor** → **New Query**
2. Öffne die Datei `supabase-storage-policies.sql` und kopiere den gesamten Inhalt
3. Füge ihn in den SQL Editor ein und klicke auf **Run**

✅ **Fertig!** Storage Policies sind konfiguriert.

---

### 4. Auth-Konfiguration (30 Sekunden)

1. Gehe zu **Authentication** → **URL Configuration**
2. Setze **Site URL:** `https://invoice-calculator-ashen.vercel.app`
3. Füge **Redirect URLs** hinzu:
   - `https://invoice-calculator-ashen.vercel.app/**`
   - `https://invoice-calculator-ashen.vercel.app/auth`
   - `https://invoice-calculator-ashen.vercel.app/auth/callback`

✅ **Fertig!** Auth ist konfiguriert.

---

## ✅ Verifizierung

Führe aus:
```bash
npm run supabase:check
```

Das Skript prüft, ob alle Storage Buckets existieren.

---

## 📚 Detaillierte Anleitung

Für eine ausführliche Anleitung siehe: **SUPABASE-SETUP.md**

---

**Fertig!** 🎉 Deine Supabase-Konfiguration ist komplett!



