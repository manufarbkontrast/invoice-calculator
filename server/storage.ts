import { uploadFile, deleteFile, getSignedUrl } from "./supabase";

const INVOICE_BUCKET = "invoices";
const EXPORT_BUCKET = "exports";

/**
 * Upload a file to Supabase Storage
 */
export async function storagePut(
  path: string,
  file: Buffer,
  contentType: string
): Promise<{ url: string; path: string }> {
  // Determine bucket based on path
  const bucket = path.startsWith("exports/") ? EXPORT_BUCKET : INVOICE_BUCKET;
  const filePath = path.startsWith("exports/") || path.startsWith("invoices/")
    ? path.replace(/^(exports|invoices)\//, "")
    : path;

  const result = await uploadFile(bucket, filePath, file, contentType);
  
  return {
    url: result.url,
    path: result.path,
  };
}

/**
 * Get a signed URL for downloading a file
 */
export async function storageGetSignedUrl(
  path: string,
  expiresIn = 3600
): Promise<string> {
  const bucket = path.startsWith("exports/") ? EXPORT_BUCKET : INVOICE_BUCKET;
  const filePath = path.startsWith("exports/") || path.startsWith("invoices/")
    ? path.replace(/^(exports|invoices)\//, "")
    : path;

  return getSignedUrl(bucket, filePath, expiresIn);
}

/**
 * Delete a file from storage
 */
export async function storageDelete(path: string): Promise<void> {
  const bucket = path.startsWith("exports/") ? EXPORT_BUCKET : INVOICE_BUCKET;
  const filePath = path.startsWith("exports/") || path.startsWith("invoices/")
    ? path.replace(/^(exports|invoices)\//, "")
    : path;

  await deleteFile(bucket, filePath);
}

/**
 * Get public URL for a file
 */
export function storageGetPublicUrl(path: string): string {
  const bucket = path.startsWith("exports/") ? EXPORT_BUCKET : INVOICE_BUCKET;
  const filePath = path.startsWith("exports/") || path.startsWith("invoices/")
    ? path.replace(/^(exports|invoices)\//, "")
    : path;

  if (!supabaseAdmin) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
