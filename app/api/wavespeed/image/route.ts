import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, resolution, variations, styleIntensity, lighting } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const resMap: Record<string, { width: number; height: number }> = {
      "512px":  { width: 512,  height: 512  },
      "1024px": { width: 1024, height: 1024 },
      "2048px": { width: 2048, height: 2048 },
      "4K":     { width: 3840, height: 2160 },
    };

    const dims = resMap[resolution as string] || { width: 1024, height: 1024 };
    const count = Math.min(8, Math.max(1, Number(variations) || 1));

    const enhancedPrompt = lighting && lighting !== "none"
      ? `${prompt}. Lighting: ${lighting}. Style intensity: ${styleIntensity || 50}%.`
      : prompt;

    const modelId = model || "wavespeed-ai/flux-dev";

    const result = await callWavespeed(modelId, {
      prompt: enhancedPrompt,
      width: dims.width,
      height: dims.height,
      num_outputs: count,
      guidance_scale: 3.5 + ((Number(styleIntensity) || 50) / 100) * 3.5,
    });

    const requestId = result.data?.id || result.id;
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
