#!/usr/bin/env tsx
/**
 * Führt die neue Features Migration aus
 */

import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import postgres from 'postgres';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Fehler: DATABASE_URL muss gesetzt sein');
  process.exit(1);
}

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
          console.log('✅ SQL Statement ausgeführt');
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message?.includes('already exists') || 
              error.message?.includes('duplicate') ||
              error.message?.includes('does not exist')) {
            console.log(`ℹ️  ${error.message}`);
          } else {
            console.warn(`⚠️  Warnung bei SQL: ${error.message}`);
            throw error;
          }
        }
      }
    }
  } finally {
    await sqlClient.end();
  }
}

async function main() {
  console.log('🚀 Führe Migration aus...\n');

  const sqlPath = join(__dirname, '..', 'supabase-migration-new-features.sql');
  const sql = readFileSync(sqlPath, 'utf-8');

  try {
    await executeSQL(sql);
    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    return true;
  } catch (error: any) {
    console.error('\n❌ Fehler bei der Migration:', error.message);
    return false;
  }
}

main().then(success => {
  process.exit(success ? 0 : 1);
});





