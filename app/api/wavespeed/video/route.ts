import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, duration, quality, aspectRatio } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const qualityMap: Record<string, number> = {
      Draft:    480,
      Standard: 720,
      High:     1080,
      Ultra:    1440,
      MAX:      2160,
    };

    const modelId = model || "wavespeed-ai/wan-v2.2-t2v-480p";

    const result = await callWavespeed(modelId, {
      prompt,
      duration:     Number(duration) || 5,
      resolution:   qualityMap[quality as string] || 720,
      aspect_ratio: aspectRatio || "16:9",
    });

    const requestId = result.data?.id || result.id;
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
