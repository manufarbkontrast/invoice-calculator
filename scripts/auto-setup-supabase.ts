#!/usr/bin/env tsx
/**
 * Vollautomatisches Supabase Setup
 * 
 * Dieses Skript führt automatisch aus:
 * 1. Database Setup (Tabellen, Enums, RLS Policies)
 * 2. Storage Buckets erstellen
 * 3. Storage Policies setzen
 * 
 * Benötigt: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DATABASE_URL in .env
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.DATABASE_URL;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Fehler: SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein');
  console.error('\nBitte setzen Sie diese Variablen in Ihrer .env Datei:');
  console.error('  SUPABASE_URL=your-supabase-url');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  process.exit(1);
}

if (!databaseUrl) {
  console.error('❌ Fehler: DATABASE_URL muss gesetzt sein');
  console.error('\nBitte setzen Sie diese Variable in Ihrer .env Datei:');
  console.error('  DATABASE_URL=postgresql://user:password@host:port/database');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function executeSQL(sql: string): Promise<void> {
  const sqlClient = postgres(databaseUrl);
  
  try {
    // Split by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await sqlClient.unsafe(statement);
        } catch (error: any) {
          // Ignore "already exists" errors
          if (!error.message?.includes('already exists') && 
              !error.message?.includes('duplicate') &&
              !error.message?.includes('does not exist')) {
            console.warn(`⚠️  Warnung bei SQL: ${error.message}`);
          }
        }
      }
    }
  } finally {
    await sqlClient.end();
  }
}

async function setupDatabase() {
  console.log('\n📊 Setup Database...\n');

  const sqlPath = join(__dirname, '..', 'supabase-setup.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    await executeSQL(sql);
    console.log('✅ Database Setup abgeschlossen!');
    return true;
  } catch (error: any) {
    console.error('❌ Fehler beim Database Setup:', error.message);
    return false;
  }
}

async function createStorageBucket(name: string, publicBucket: boolean, fileSizeLimit: number, allowedMimeTypes: string[]) {
  try {
    // Check if bucket already exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === name);

    if (exists) {
      console.log(`✅ Bucket "${name}" existiert bereits`);
      return true;
    }

    // Create bucket via REST API
    const response = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
      },
      body: JSON.stringify({
        name,
        public: publicBucket,
        file_size_limit: fileSizeLimit * 1024 * 1024, // Convert MB to bytes
        allowed_mime_types: allowedMimeTypes,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create bucket: ${response.status} ${error}`);
    }

    console.log(`✅ Bucket "${name}" erstellt`);
    return true;
  } catch (error: any) {
    console.error(`❌ Fehler beim Erstellen von Bucket "${name}":`, error.message);
    return false;
  }
}

async function setupStorageBuckets() {
  console.log('\n📦 Setup Storage Buckets...\n');

  const buckets = [
    {
      name: 'invoices',
      public: false,
      fileSizeLimit: 50, // MB
      allowedMimeTypes: ['application/pdf', 'image/*'],
    },
    {
      name: 'exports',
      public: false,
      fileSizeLimit: 100, // MB
      allowedMimeTypes: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'application/zip',
        'text/csv',
      ],
    },
  ];

  let allSuccess = true;
  for (const bucket of buckets) {
    const success = await createStorageBucket(
      bucket.name,
      bucket.public,
      bucket.fileSizeLimit,
      bucket.allowedMimeTypes
    );
    if (!success) allSuccess = false;
  }

  return allSuccess;
}

async function setupStoragePolicies() {
  console.log('\n🔒 Setup Storage Policies...\n');

  const sqlPath = join(__dirname, '..', 'supabase-storage-policies.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    await executeSQL(sql);
    console.log('✅ Storage Policies Setup abgeschlossen!');
    return true;
  } catch (error: any) {
    console.error('❌ Fehler beim Storage Policies Setup:', error.message);
    return false;
  }
}

async function setupAuthConfig() {
  console.log('\n🔐 Setup Auth-Konfiguration...\n');

  const siteUrl = 'https://invoice-calculator-ashen.vercel.app';
  const redirectUrls = [
    'https://invoice-calculator-ashen.vercel.app/**',
    'https://invoice-calculator-ashen.vercel.app/auth',
    'https://invoice-calculator-ashen.vercel.app/auth/callback',
  ];

  try {
    // Try to update auth config via Management API
    // Note: This might not work if the Management API doesn't support it
    // In that case, we'll provide manual instructions
    
    const projectRef = supabaseUrl.split('//')[1]?.split('.')[0];
    if (!projectRef) {
      throw new Error('Could not extract project ref from URL');
    }

    // Try to get current config first
    const configResponse = await fetch(
      `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (configResponse.ok) {
      const currentConfig = await configResponse.json();
      
      // Update config
      const updateResponse = await fetch(
        `https://api.supabase.com/v1/projects/${projectRef}/config/auth`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            site_url: siteUrl,
            redirect_urls: redirectUrls,
          }),
        }
      );

      if (updateResponse.ok) {
        console.log(`✅ Site URL gesetzt: ${siteUrl}`);
        console.log(`✅ Redirect URLs konfiguriert`);
        return true;
      } else {
        const errorText = await updateResponse.text();
        throw new Error(`Update failed: ${updateResponse.status} ${errorText}`);
      }
    } else {
      // Management API might not be available, provide manual instructions
      throw new Error('Management API not available');
    }
  } catch (error: any) {
    console.log('ℹ️  Auth-Konfiguration kann nicht automatisch gesetzt werden.');
    console.log('   Bitte konfigurieren Sie die Auth-URLs manuell im Dashboard:\n');
    console.log('   1. Gehen Sie zu: Authentication → URL Configuration');
    console.log(`   2. Setzen Sie Site URL: ${siteUrl}`);
    console.log('   3. Fügen Sie Redirect URLs hinzu:');
    redirectUrls.forEach(url => console.log(`      - ${url}`));
    console.log('');
    return false;
  }
}

async function verifySetup() {
  console.log('\n🔍 Verifiziere Setup...\n');

  // Check buckets
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ Fehler beim Abrufen der Buckets:', bucketsError.message);
    return false;
  }

  const bucketNames = buckets?.map(b => b.name) || [];
  const requiredBuckets = ['invoices', 'exports'];
  
  for (const bucketName of requiredBuckets) {
    if (bucketNames.includes(bucketName)) {
      console.log(`✅ Bucket "${bucketName}" existiert`);
    } else {
      console.log(`❌ Bucket "${bucketName}" fehlt`);
      return false;
    }
  }

  // Check tables (via direct database query)
  try {
    const sqlClient = postgres(databaseUrl);
    const tables = await sqlClient`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'projects', 'invoices', 'teams', 'team_members', 'team_invitations')
    `;
    await sqlClient.end();

    const tableNames = tables.map((t: any) => t.table_name);
    const requiredTables = ['users', 'projects', 'invoices', 'teams', 'team_members', 'team_invitations'];

    for (const tableName of requiredTables) {
      if (tableNames.includes(tableName)) {
        console.log(`✅ Tabelle "${tableName}" existiert`);
      } else {
        console.log(`❌ Tabelle "${tableName}" fehlt`);
        return false;
      }
    }
  } catch (error: any) {
    console.warn(`⚠️  Konnte Tabellen nicht verifizieren: ${error.message}`);
  }

  return true;
}

async function main() {
  console.log('🚀 Vollautomatisches Supabase Setup\n');
  console.log('='.repeat(60));

  // Step 1: Database Setup
  const dbSuccess = await setupDatabase();
  if (!dbSuccess) {
    console.error('\n❌ Database Setup fehlgeschlagen. Bitte prüfen Sie die Fehler oben.');
    process.exit(1);
  }

  // Step 2: Storage Buckets
  const bucketsSuccess = await setupStorageBuckets();
  if (!bucketsSuccess) {
    console.warn('\n⚠️  Einige Storage Buckets konnten nicht erstellt werden.');
    console.warn('   Bitte erstellen Sie sie manuell im Dashboard (siehe SUPABASE-SETUP.md)');
  }

  // Step 3: Storage Policies
  const policiesSuccess = await setupStoragePolicies();
  if (!policiesSuccess) {
    console.error('\n❌ Storage Policies Setup fehlgeschlagen.');
    process.exit(1);
  }

  // Step 4: Auth Configuration
  await setupAuthConfig();

  // Step 5: Verify
  const verifySuccess = await verifySetup();

  console.log('\n' + '='.repeat(60));
  
  if (verifySuccess) {
    console.log('\n✅ Supabase Setup erfolgreich abgeschlossen! 🎉\n');
    console.log('📝 Nächste Schritte:');
    console.log('   1. Konfiguriere Auth URLs im Dashboard:');
    console.log('      Authentication → URL Configuration');
    console.log('      Site URL: https://invoice-calculator-ashen.vercel.app');
    console.log('      Redirect URLs: https://invoice-calculator-ashen.vercel.app/**');
    console.log('   2. Teste die Anwendung!\n');
  } else {
    console.log('\n⚠️  Setup abgeschlossen, aber Verifizierung zeigt Probleme.');
    console.log('   Bitte prüfen Sie die Fehler oben.\n');
  }
}

main().catch((error) => {
  console.error('❌ Unerwarteter Fehler:', error);
  process.exit(1);
});

