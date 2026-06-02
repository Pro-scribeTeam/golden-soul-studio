import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

export async function POST(req: NextRequest) {
  try {
    const { model, videoUrl, audioUrl, syncMode, expressionIntensity } = await req.json();

    const modelId = model || "sync/lipsync-2";

    const result = await callWavespeed(modelId, {
      video_url:            videoUrl,
      audio_url:            audioUrl,
      sync_mode:            syncMode || "auto",
      expression_intensity: (Number(expressionIntensity) || 50) / 100,
    });

    const requestId = result.data?.id || result.id;
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
