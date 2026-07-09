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
    const { model, prompt, resolution, styleIntensity, referenceImageUrl } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const size = SIZE_MAP[resolution as string] || "1024*1024";
    const guidanceScale = 3.5 + ((Number(styleIntensity) || 50) / 100) * 3.5;

    let modelId: string;
    let input: Record<string, unknown>;

    if (referenceImageUrl) {
      // Reference image provided — use Nano Banana 2 edit or FLUX Kontext
      if (model === "google/nano-banana-2" || model === "google/nano-banana-pro") {
        modelId = model === "google/nano-banana-2" ? "google/nano-banana-2/edit" : "google/nano-banana-pro/edit";
        input = { images: [referenceImageUrl], prompt, resolution: "2k" };
      } else {
        // Fall back to FLUX Kontext Max for all other models
        modelId = "wavespeed-ai/flux-kontext-max";
        input = { image: referenceImageUrl, prompt, guidance_scale: guidanceScale };
      }
    } else {
      // Pure text-to-image — always 1 image per request (caller fires N parallel requests for variations)
      modelId = MODEL_MAP[model] || "wavespeed-ai/flux-2-klein-9b/text-to-image";
      input = { prompt, size, num_images: 1, seed: -1, enable_sync_mode: false, guidance_scale: guidanceScale };
    }

    const result = await callWavespeed(modelId, input);
    const requestId = result.data?.id || result.id;
    if (!requestId) throw new Error("No request ID returned from WaveSpeed");

    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
