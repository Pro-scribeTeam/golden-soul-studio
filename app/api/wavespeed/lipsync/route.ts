import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

const MODEL_MAP: Record<string, string> = {
  "wavespeed-ai/ai-music-video-generator": "wavespeed-ai/music-video-generator",
  "wavespeed-ai/music-video-generator":    "wavespeed-ai/music-video-generator",
  "sync/lipsync-3":                        "wavespeed-ai/infinitetalk/video-to-video",
  "sync/lipsync-2-pro":                    "wavespeed-ai/infinitetalk/video-to-video",
  "sync/lipsync-1-9-0":                    "wavespeed-ai/infinitetalk/video-to-video",
  "sync/lipsync-2":                        "wavespeed-ai/infinitetalk/video-to-video",
  "wavespeed-ai/infinitetalk":             "wavespeed-ai/infinitetalk",
  "wavespeed-ai/infinitetalk-multi":       "wavespeed-ai/infinitetalk",
  "kwaivgi/kling-lipsync":                 "wavespeed-ai/infinitetalk/video-to-video",
  "bytedance/lipsync":                     "wavespeed-ai/infinitetalk/video-to-video",
  "pixverse/lipsync":                      "wavespeed-ai/infinitetalk/video-to-video",
};

export async function POST(req: NextRequest) {
  try {
    const { model, videoUrl, audioUrl, syncMode, expressionIntensity } = await req.json();

    const modelId = MODEL_MAP[model] || "wavespeed-ai/infinitetalk/video-to-video";

    const result = await callWavespeed(modelId, {
      video_url:            videoUrl,
      audio_url:            audioUrl,
      sync_mode:            syncMode || "auto",
      expression_intensity: (Number(expressionIntensity) || 50) / 100,
    });

    const requestId = result.data?.id || result.id;
    if (!requestId) throw new Error("No request ID returned from WaveSpeed");

    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
