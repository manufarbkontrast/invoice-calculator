#!/usr/bin/env tsx
/**
 * Supabase Setup Script
 * 
 * Dieses Skript prüft, ob die Supabase-Konfiguration korrekt ist:
 * - Prüft ob Storage Buckets existieren
 * - Gibt Anweisungen für manuelle Schritte
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehler: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
  console.error('\nBitte setzen Sie diese Variablen in Ihrer .env Datei:');
  console.error('  SUPABASE_URL=your-supabase-url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkStorageBuckets() {
  console.log('\n📦 Prüfe Storage Buckets...\n');

  const requiredBuckets = [
    { name: 'invoices', description: 'Für hochgeladene Rechnungs-PDFs' },
    { name: 'exports', description: 'Für exportierte Excel-Dateien' },
  ];

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Fehler beim Abrufen der Buckets:', error.message);
    return false;
  }

  const existingBucketNames = buckets.map(b => b.name);
  let allBucketsExist = true;

  for (const bucket of requiredBuckets) {
    if (existingBucketNames.includes(bucket.name)) {
      console.log(`✅ Bucket "${bucket.name}" existiert`);
    } else {
      console.log(`❌ Bucket "${bucket.name}" fehlt`);
      console.log(`   Beschreibung: ${bucket.description}`);
      allBucketsExist = false;
    }
  }

  if (!allBucketsExist) {
    console.log('\n📝 Bitte erstellen Sie die fehlenden Buckets im Supabase Dashboard:');
    console.log('   1. Gehen Sie zu Storage → Buckets');
    console.log('   2. Klicken Sie auf "New Bucket"');
    console.log('   3. Folgen Sie der Anleitung in SUPABASE-SETUP.md\n');
  }

  return allBucketsExist;
}

async function checkDatabaseTables() {
  console.log('\n🗄️  Prüfe Database Tables...\n');

  const requiredTables = [
    'users',
    'projects',
    'invoices',
    'teams',
    'team_members',
    'team_invitations',
  ];

  // Note: We can't directly query table existence via Supabase JS client
  // This would require direct database access
  console.log('ℹ️  Bitte führen Sie das SQL-Skript "supabase-setup.sql" im Supabase SQL Editor aus');
  console.log('   Dashboard → SQL Editor → New Query → supabase-setup.sql einfügen → Run\n');
}

async function main() {
  console.log('🚀 Supabase Setup Check\n');
  console.log('='.repeat(50));

  const bucketsOk = await checkStorageBuckets();
  await checkDatabaseTables();

  console.log('='.repeat(50));
  console.log('\n📚 Vollständige Anleitung: Siehe SUPABASE-SETUP.md\n');

  if (bucketsOk) {
    console.log('✅ Alle Storage Buckets sind vorhanden!');
  } else {
    console.log('⚠️  Bitte erstellen Sie die fehlenden Storage Buckets.');
  }

  console.log('\n✨ Setup-Check abgeschlossen!\n');
}

main().catch((error) => {
  console.error('❌ Fehler:', error);
  process.exit(1);
});

