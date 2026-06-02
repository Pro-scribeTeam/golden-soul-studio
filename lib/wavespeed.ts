const WAVESPEED_BASE = "https://api.wavespeed.ai";

export async function callWavespeed(endpoint: string, body: Record<string, unknown>) {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error("WAVESPEED_API_KEY not configured");

  const res = await fetch(`${WAVESPEED_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WaveSpeed API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function pollStatus(requestId: string): Promise<{
  status: string;
  outputs?: string[];
  error?: string;
  progress?: number;
}> {
  const apiKey = process.env.WAVESPEED_API_KEY;
  if (!apiKey) throw new Error("WAVESPEED_API_KEY not configured");

  const res = await fetch(`${WAVESPEED_BASE}/api/v1/results/${requestId}`, {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`WaveSpeed status error ${res.status}: ${text}`);
  }

  return res.json();
}

export const MODEL_IDS = {
  // Video
  "Kling 3.0": "kwaivgi/kling-v3",
  "Sora 2": "minimax/video-01",
  "Seedance 2.0": "bytedance/seedance-v1-lite",
  "Veo 3.1": "google/veo-3",
  "LTX Video 2.3": "lightricks/ltx-video-0.9.7",
  "Runway Gen-4": "runwayml/gen4-turbo",
  "Wan 2.7": "wavespeed-ai/wan-v2.7-t2v-720p",
  "Wan 2.2": "wavespeed-ai/wan-v2.2-t2v-480p",
  // Image
  "Nano Banana Pro": "google/nano-banana-pro",
  "Nano Banana 2": "google/nano-banana-2",
  "FLUX.2": "wavespeed-ai/flux-dev",
  "Seedream 5": "bytedance/seedream-5",
  "Seedream 4.5": "bytedance/seedream-4-5",
  "HunyuanImage 3.0": "tencent/hunyuan-image-3-0",
  "GPT Image 2": "openai/gpt-image-2",
  "Stable Diffusion 3.5": "stability/stable-diffusion-3-5",
  // Motion
  "SteadyDancer": "wavespeed-ai/steady-dancer",
  "DreamActor V2": "bytedance/dreamactor-v2",
  "Kling 2.6 Pro Motion": "kwaivgi/kling-v2.6-pro/motion-control",
  "Kling 2.6 Standard Motion": "kwaivgi/kling-v2.6-std/motion-control",
  "SCAIL": "wavespeed-ai/scail",
  // Lip Sync
  "AI Music Video Generator": "wavespeed-ai/ai-music-video-generator",
  "Sync LipSync-3": "sync/lipsync-3",
  "Sync LipSync-2-Pro": "sync/lipsync-2-pro",
  "Sync LipSync-1.9.0": "sync/lipsync-1-9-0",
  "Sync LipSync-2": "sync/lipsync-2",
  "Kling LipSync": "kwaivgi/kling-lipsync",
  "ByteDance LipSync": "bytedance/lipsync",
  "InfiniteTalk": "wavespeed-ai/infinitetalk",
  "InfiniteTalk Multi": "wavespeed-ai/infinitetalk-multi",
  "PixVerse LipSync": "pixverse/lipsync",
} as const;

export const MODEL_COSTS: Record<string, string> = {
  "SteadyDancer": "~$0.20/run",
  "DreamActor V2": "~$0.05/run",
  "Sync LipSync-3": "$0.134/sec",
  "Kling 3.0": "~$0.45/run",
  "Sora 2": "~$0.50/run",
};
