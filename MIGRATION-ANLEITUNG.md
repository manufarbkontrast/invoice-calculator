# Migration-Anleitung für neue Features

## ✅ Abgeschlossen

1. **Drizzle Schema erweitert** - `user_settings` und `export_history` Tabellen hinzugefügt
2. **Backend-Funktionen implementiert** - Alle DB-Funktionen für Settings, Export History und Bulk-Operationen
3. **Backend-Router erweitert** - Alle tRPC-Endpunkte implementiert
4. **Frontend-Seiten erstellt** - Settings und Export History Seiten
5. **Bulk-Operationen UI** - Checkboxen und Bulk-Actions in MonthDetail
6. **Erweiterte Suche** - UI und Backend implementiert
7. **TypeScript-Check** - ✅ Alle Fehler behoben

## 📋 Noch zu erledigen

### 1. SQL-Migration ausführen

Die SQL-Migration muss im Supabase Dashboard ausgeführt werden:

1. Öffnen Sie das Supabase Dashboard
2. Gehen Sie zu **SQL Editor** → **New Query**
3. Kopieren Sie den Inhalt von `supabase-migration-new-features.sql`
4. Führen Sie das SQL aus

**Oder** führen Sie das Script aus (wenn DATABASE_URL korrekt konfiguriert ist):
```bash
pnpm tsx scripts/run-migration.ts
```

### 2. Drizzle Migration (optional)

Wenn Sie Drizzle für Schema-Sync verwenden:
```bash
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

**Hinweis:** Die SQL-Migration ist vollständig und sollte direkt ausgeführt werden können.

## 🎯 Neue Features

### User Settings (`/settings`)
- Profil-Verwaltung (Name ändern)
- Export-Einstellungen (Standard-Wechselkurs, Export-Format)
- Benachrichtigungseinstellungen

### Export History (`/exports`)
- Alle Exporte werden automatisch getrackt
- Download und Löschen von Exporten
- Filter nach Export-Typ und Datum

### Bulk-Operationen (in MonthDetail)
- Mehrere Rechnungen auswählen
- Bulk-Löschen
- Bulk-Projektzuweisung
- Bulk-Status-Update (als bezahlt markieren)

### Erweiterte Suche (in MonthDetail)
- Datum-Filter (Von/Bis)
- Betrags-Filter (Min/Max)
- Währungs-Filter
- Kombinierbar mit bestehenden Filtern

## 🚀 Nächste Schritte

1. SQL-Migration ausführen (siehe oben)
2. App testen:
   - Settings-Seite öffnen
   - Export erstellen und in Historie prüfen
   - Bulk-Operationen in MonthDetail testen
   - Erweiterte Suche testen

