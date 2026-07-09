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

const BASE_PX: Record<string, number> = {
  "512px":  512,
  "1024px": 1024,
  "2048px": 2048,
  "4K":     2048,
};

const ASPECT_DIMS: Record<string, [number, number]> = {
  "1:1":  [1, 1],
  "4:3":  [4, 3],
  "16:9": [16, 9],
  "3:4":  [3, 4],
  "9:16": [9, 16],
};

function computeSize(resolution: string, aspectRatio: string): string {
  const base = BASE_PX[resolution] || 1024;
  const [w, h] = ASPECT_DIMS[aspectRatio] || [1, 1];
  const scale = base / Math.max(w, h);
  // Round to nearest multiple of 8 (required by most diffusion models)
  const width  = Math.round(scale * w / 8) * 8;
  const height = Math.round(scale * h / 8) * 8;
  return `${width}*${height}`;
}

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, resolution, aspectRatio, styleIntensity, referenceImageUrl } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const size = computeSize(resolution as string, aspectRatio as string);
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
        input = { image: referenceImageUrl, prompt, aspect_ratio: aspectRatio || "1:1", guidance_scale: guidanceScale };
      }
    } else {
      // Pure text-to-image — always 1 image per request (caller fires N parallel requests for variations)
      modelId = MODEL_MAP[model] || "wavespeed-ai/flux-2-klein-9b/text-to-image";

      // FLUX Kontext models use `aspect_ratio` string; FLUX.2 / Dev use `size` "W*H"
      if (modelId.includes("flux-kontext") || modelId.includes("flux-2-max")) {
        input = { prompt, aspect_ratio: aspectRatio || "1:1", num_images: 1, seed: -1, enable_sync_mode: false, guidance_scale: guidanceScale };
      } else {
        input = { prompt, size, num_images: 1, seed: -1, enable_sync_mode: false, guidance_scale: guidanceScale };
      }
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
