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
    const { imageUrl, prompt, model, strength } = await req.json();
    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: "imageUrl and prompt are required" }, { status: 400 });
    }

    const modelId = MODEL_MAP[model] || "wavespeed-ai/flux-kontext-max";

    let input: Record<string, unknown>;
    if (NANO_BANANA_MODELS.has(model)) {
      // Nano Banana: images array, resolution string
      input = {
        images: [imageUrl],
        prompt,
        resolution: "2k",
      };
    } else {
      // FLUX Kontext: image string, guidance_scale (1–20)
      const guidanceScale = 1 + ((Number(strength) || 80) / 100) * 19; // map 0–100 → 1–20
      input = {
        image: imageUrl,
        prompt,
        guidance_scale: Math.round(guidanceScale * 10) / 10,
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
