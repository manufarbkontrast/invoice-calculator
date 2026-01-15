import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Auth features will not work.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Auth helper functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

// Storage helper functions
export async function uploadInvoice(file: File, userId: string) {
  const fileName = `${userId}/${Date.now()}-${file.name}`;
  
  const { data, error } = await supabase.storage
    .from('invoices')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });
  
  if (error) throw error;
  
  // Get public URL
  const { data: urlData } = supabase.storage
    .from('invoices')
    .getPublicUrl(data.path);
  
  return {
    path: data.path,
    url: urlData.publicUrl,
  };
}

export async function getInvoiceUrl(path: string) {
  const { data } = supabase.storage
    .from('invoices')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

export async function downloadInvoice(path: string) {
  const { data, error } = await supabase.storage
    .from('invoices')
    .download(path);
  
  if (error) throw error;
  return data;
}

export async function deleteInvoiceFile(path: string) {
  const { error } = await supabase.storage
    .from('invoices')
    .remove([path]);
  
  if (error) throw error;
}


