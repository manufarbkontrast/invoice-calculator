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
    const contentType = response.headers.get("content-type");
    let errorMessage = `Storage upload failed: ${response.statusText}`;
    
    // Try to get error message from response
    try {
      if (contentType && contentType.includes("application/json")) {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } else {
        const text = await response.text();
        // If it's HTML, extract a meaningful error
        if (text.includes("error") || text.includes("Error")) {
          errorMessage = `Storage upload failed: ${response.status} ${response.statusText}`;
        }
      }
    } catch {
      // If parsing fails, use default error message
    }
    
    throw new Error(errorMessage);
  }

  // Verify response is JSON before parsing
  const contentType = response.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    const text = await response.text();
    throw new Error(`Expected JSON response but got ${contentType}: ${text.substring(0, 100)}`);
  }

  return response.json();
}

