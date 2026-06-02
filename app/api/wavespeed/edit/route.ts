import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

const MODEL_MAP: Record<string, string> = {
  "flux-kontext-max": "wavespeed-ai/flux-kontext-max/image-to-image",
  "flux-kontext-pro": "wavespeed-ai/flux-kontext-pro/image-to-image",
  "flux-dev":         "wavespeed-ai/flux-dev/image-to-image",
};

export async function POST(req: NextRequest) {
  try {
    const { imageUrl, prompt, model, strength } = await req.json();
    if (!imageUrl || !prompt) {
      return NextResponse.json({ error: "imageUrl and prompt are required" }, { status: 400 });
    }

    const modelId = MODEL_MAP[model] || "wavespeed-ai/flux-kontext-max/image-to-image";

    const result = await callWavespeed(modelId, {
      image_url: imageUrl,
      prompt,
      strength: (Number(strength) || 80) / 100,
    });

    const requestId = result.data?.id || result.id;
    if (!requestId) throw new Error("No request ID returned from WaveSpeed");
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
