/**
 * Upload a file directly to Supabase storage from the browser,
 * bypassing Vercel's serverless payload limit.
 */
export async function uploadFileDirect(file: File): Promise<string> {
  // 1. Get a signed upload URL from our tiny API endpoint
  const res = await fetch(`/api/upload-signed?filename=${encodeURIComponent(file.name)}`);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const { signedUrl, publicUrl } = data as { signedUrl: string; publicUrl: string };

  // 2. Upload directly to Supabase (no Vercel payload limit applies)
  const uploadRes = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });

  if (!uploadRes.ok) {
    const text = await uploadRes.text();
    throw new Error(`Upload failed (${uploadRes.status}): ${text.slice(0, 120)}`);
  }

  return publicUrl;
}
