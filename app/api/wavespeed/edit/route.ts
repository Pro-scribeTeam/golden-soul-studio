import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

// Verified model IDs from wavespeed.ai/models (June 2026)
const MODEL_MAP: Record<string, string> = {
  "nano-banana-pro":  "google/nano-banana-pro/edit",
  "nano-banana-2":    "google/nano-banana-2/edit",
  "flux-kontext-max": "wavespeed-ai/flux-kontext-max",
  "flux-kontext-pro": "wavespeed-ai/flux-kontext-pro",
  "flux-kontext-dev": "wavespeed-ai/flux-kontext-dev",
};

// Nano Banana models use `images` array; FLUX Kontext uses `image` string
const NANO_BANANA_MODELS = new Set(["nano-banana-pro", "nano-banana-2"]);

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, model, strength, additionalImageUrls, aspectRatio, resolution } = await req.json();
    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: "imageUrl and prompt are required" }, { status: 400 });
    }

    const modelId = MODEL_MAP[model] || "wavespeed-ai/flux-kontext-max";
    const extraUrls: string[] = Array.isArray(additionalImageUrls) ? additionalImageUrls.filter(Boolean) : [];

    let input: Record<string, unknown>;
    const ASPECT_DIMS: Record<string, [number, number]> = {
      "1:1": [1, 1], "4:3": [4, 3], "16:9": [16, 9], "3:4": [3, 4], "9:16": [9, 16],
    };
    const BASE_PX: Record<string, number> = { "512px": 512, "1024px": 1024, "2048px": 2048, "4K": 2048 };
    const [aw, ah] = ASPECT_DIMS[aspectRatio as string] || [1, 1];
    const base = BASE_PX[resolution as string] || 1024;
    const scale = base / Math.max(aw, ah);
    const outWidth  = Math.round(scale * aw / 8) * 8;
    const outHeight = Math.round(scale * ah / 8) * 8;

    if (NANO_BANANA_MODELS.has(model)) {
      // Nano Banana: images array — source image first, then additional references
      input = {
        images: [imageUrl, ...extraUrls],
        prompt,
        resolution: "2k",
      };
    } else {
      // FLUX Kontext: single image — additional images referenced in prompt
      const guidanceScale = 1 + ((Number(strength) || 80) / 100) * 19; // map 0–100 → 1–20
      const referenceNote = extraUrls.length > 0
        ? ` Reference image${extraUrls.length > 1 ? "s" : ""}: ${extraUrls.join(", ")}.`
        : "";
      input = {
        image: imageUrl,
        prompt: prompt + referenceNote,
        guidance_scale: Math.round(guidanceScale * 10) / 10,
        width: outWidth,
        height: outHeight,
      };
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
