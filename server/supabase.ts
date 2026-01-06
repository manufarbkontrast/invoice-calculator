import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client only when credentials are present; otherwise keep it null
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

if (!supabaseAdmin) {
  console.warn('[Supabase] SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlen. Admin-Client wird nicht initialisiert.');
}

// Storage operations
export async function uploadFile(
  bucket: string,
  path: string,
  file: Buffer,
  contentType: string
) {
  // Check if Supabase is configured
  if (!supabaseAdmin || !supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      "Supabase Storage ist nicht konfiguriert. SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY müssen gesetzt sein."
    );
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, file, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error(`[Supabase Storage] Upload error for bucket "${bucket}":`, error);
      
      // Provide helpful error messages
      if (error.message?.includes('Bucket not found') || error.message?.includes('does not exist')) {
        throw new Error(
          `Storage-Bucket "${bucket}" existiert nicht. Bitte erstellen Sie den Bucket in Supabase Dashboard > Storage.`
        );
      }
      
      if (error.message?.includes('new row violates row-level security')) {
        throw new Error(
          `Storage-Bucket "${bucket}" hat RLS aktiviert. Bitte deaktivieren Sie RLS oder konfigurieren Sie die Storage-Policies.`
        );
      }
      
      throw new Error(
        `Supabase Storage Upload fehlgeschlagen: ${error.message || String(error)}`
      );
    }

    if (!data) {
      throw new Error("Supabase Storage hat keine Daten zurückgegeben");
    }

    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    if (!urlData || !urlData.publicUrl) {
      throw new Error("Konnte keine öffentliche URL für die hochgeladene Datei generieren");
    }

    return {
      path: data.path,
      url: urlData.publicUrl,
    };
  } catch (error) {
    console.error(`[Supabase Storage] Upload failed for bucket "${bucket}", path "${path}":`, error);
    throw error;
  }
}

export async function deleteFile(bucket: string, path: string) {
  if (!supabaseAdmin) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path]);

  if (error) throw error;
}

export async function getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
  if (!supabaseAdmin) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }
  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) throw error;
  return data.signedUrl;
}


