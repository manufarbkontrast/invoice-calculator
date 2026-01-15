/**
 * Client-side storage helper for uploading files to S3
 */

const API_URL = import.meta.env.VITE_BUILT_IN_FORGE_API_URL || 'https://api.manus.im';
const API_KEY = import.meta.env.VITE_BUILT_IN_FORGE_API_KEY || '';

export async function storagePut(
  key: string,
  data: Uint8Array | ArrayBuffer,
  contentType?: string
): Promise<{ key: string; url: string }> {
  const buffer = data instanceof ArrayBuffer ? new Uint8Array(data) : data;
  
  const response = await fetch(`${API_URL}/storage/put`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      key,
      data: Array.from(buffer),
      contentType: contentType || 'application/octet-stream',
    }),
  });

  if (!response.ok) {
    throw new Error(`Storage upload failed: ${response.statusText}`);
  }

  return response.json();
}

