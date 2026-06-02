import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { model, videoUrl, audioUrl, syncMode, expressionIntensity } = await req.json();

    const apiKey = process.env.WAVESPEED_API_KEY;
    if (!apiKey) throw new Error("WAVESPEED_API_KEY not configured");

    const res = await fetch("https://api.wavespeed.ai/api/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || "sync/lipsync-2",
        input: {
          video_url: videoUrl,
          audio_url: audioUrl,
          sync_mode: syncMode || "auto",
          expression_intensity: (expressionIntensity || 50) / 100,
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`WaveSpeed error ${res.status}: ${text}`);
    }

    const result = await res.json();
    return NextResponse.json({
      requestId: result.data?.id || result.id,
      status: "processing",
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
