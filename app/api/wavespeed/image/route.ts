import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

// Map UI model names to verified WaveSpeed v3 model IDs
const MODEL_MAP: Record<string, string> = {
  "google/nano-banana-pro":          "wavespeed-ai/flux-kontext-max/text-to-image",
  "google/nano-banana-2":            "wavespeed-ai/flux-2-klein-9b/text-to-image",
  "wavespeed-ai/flux-dev":           "wavespeed-ai/flux-dev",
  "wavespeed-ai/flux-kontext-max":   "wavespeed-ai/flux-kontext-max/text-to-image",
  "bytedance/seedream-5":            "wavespeed-ai/flux-2-klein-9b/text-to-image",
  "bytedance/seedream-4-5":          "wavespeed-ai/flux-2-klein-9b/text-to-image",
  "tencent/hunyuan-image-3-0":       "wavespeed-ai/flux-kontext-pro/text-to-image",
  "openai/gpt-image-2":              "openai/gpt-image-2/text-to-image",
  "stability/stable-diffusion-3-5":  "wavespeed-ai/flux-dev",
};

const SIZE_MAP: Record<string, string> = {
  "512px":  "512*512",
  "1024px": "1024*1024",
  "2048px": "2048*2048",
  "4K":     "2048*2048", // WaveSpeed max is 2048
};

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, resolution, variations, styleIntensity } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const modelId = MODEL_MAP[model] || "wavespeed-ai/flux-2-klein-9b/text-to-image";
    const size = SIZE_MAP[resolution as string] || "1024*1024";
    const count = Math.min(4, Math.max(1, Number(variations) || 1));

    // Generate sequentially if multiple — submit first one now
    const result = await callWavespeed(modelId, {
      prompt,
      size,
      num_images: count,
      seed: -1,
      enable_sync_mode: false,
      guidance_scale: 3.5 + ((Number(styleIntensity) || 50) / 100) * 3.5,
    });

    const requestId = result.data?.id || result.id;
    if (!requestId) throw new Error("No request ID returned from WaveSpeed");

    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
