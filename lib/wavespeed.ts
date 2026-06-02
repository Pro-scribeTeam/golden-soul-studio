const WAVESPEED_BASE = "https://api.wavespeed.ai";
const API_VERSION = "v3";

export async function callWavespeed(modelId: string, input: Record<string, unknown>) {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error("WAVESPEED_API_KEY not configured");

  const res = await fetch(`${WAVESPEED_BASE}/api/${API_VERSION}/${modelId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`WaveSpeed API error ${res.status}: ${text}`);
  }

  return JSON.parse(text);
}

export async function pollStatus(requestId: string): Promise<{
  status: string;
  outputs?: string[];
  error?: string;
  progress?: number;
}> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error("WAVESPEED_API_KEY not configured");

  const res = await fetch(
    `${WAVESPEED_BASE}/api/${API_VERSION}/predictions/${requestId}/result`,
    {
      headers: { "Authorization": `Bearer ${apiKey}` },
    }
  );

  const text = await res.text();
  if (!res.ok) throw new Error(`WaveSpeed status error ${res.status}: ${text}`);

  const json = JSON.parse(text);
  const data = json.data || json;

  return {
    status:  data.status || "processing",
    outputs: data.outputs || [],
    error:   data.error,
    progress: data.progress,
  };
}

// Verified model IDs from WaveSpeed API v3 (June 2026)
export const MODEL_IDS = {
  // Image
  "Nano Banana Pro":      "google/nano-banana-pro/edit",
  "Nano Banana 2":        "google/nano-banana-2/edit",
  "FLUX.2 Klein":         "wavespeed-ai/flux-2-klein-9b/text-to-image",
  "FLUX Dev":             "wavespeed-ai/flux-dev",
  "FLUX Kontext Max":     "wavespeed-ai/flux-kontext-max/text-to-image",
  "FLUX Kontext Pro":     "wavespeed-ai/flux-kontext-pro/text-to-image",
  "Seedream 5":           "bytedance/seedream-v5.0-lite/edit",
  "Seedream 4.5":         "bytedance/seedream-v4.5/edit",
  "GPT Image 2":          "openai/gpt-image-2/text-to-image",
  // Video
  "Seedance 2.0":         "bytedance/seedance-2.0/text-to-video",
  "Seedance 2.0 Fast":    "bytedance/seedance-2.0-fast/text-to-video",
  "Kling 3.0 Std":        "kwaivgi/kling-v3.0-std/image-to-video",
  "Wan 2.7":              "alibaba/wan-2.7/image-to-video",
  // Lip Sync / Avatar
  "AI Music Video":       "wavespeed-ai/music-video-generator",
  "InfiniteTalk":         "wavespeed-ai/infinitetalk",
  "InfiniteTalk Video":   "wavespeed-ai/infinitetalk/video-to-video",
  // Motion
  "Kling Motion Pro":     "kwaivgi/kling-v2.6-pro/motion-control",
} as const;
