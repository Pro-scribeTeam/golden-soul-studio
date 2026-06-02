import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

// Verified text-to-video model IDs
const T2V_MODEL_MAP: Record<string, string> = {
  "kwaivgi/kling-v3":              "bytedance/seedance-2.0/text-to-video",
  "minimax/video-01":              "bytedance/seedance-2.0/text-to-video",
  "bytedance/seedance-v1-lite":    "bytedance/seedance-2.0/text-to-video",
  "google/veo-3":                  "bytedance/seedance-2.0/text-to-video",
  "lightricks/ltx-video-0.9.7":   "bytedance/seedance-2.0-fast/text-to-video",
  "runwayml/gen4-turbo":           "bytedance/seedance-2.0-fast/text-to-video",
  "wavespeed-ai/wan-v2.2-t2v-480p": "bytedance/seedance-2.0-fast/text-to-video",
};

// Image-to-video model IDs (June 2026)
const I2V_MODEL_MAP: Record<string, string> = {
  "kling-i2v":     "kwaivgi/kling-v3.0-std/image-to-video",
  "wan-i2v":       "alibaba/wan-2.7/image-to-video",
  "ltx-i2v":       "lightricks/ltx-video/image-to-video",
  "seedance-i2v":  "bytedance/seedance-2.0/image-to-video",
  "veo-i2v":       "bytedance/seedance-2.0/image-to-video",
};

const RESOLUTION_MAP: Record<string, string> = {
  Draft:    "480p",
  Standard: "720p",
  High:     "1080p",
  Ultra:    "1080p",
  MAX:      "1080p",
};

export async function POST(req: NextRequest) {
  try {
    const { model, prompt, duration, quality, aspectRatio, imageUrl } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const isI2V = Boolean(imageUrl);
    const modelId = isI2V
      ? (I2V_MODEL_MAP[model] || "kwaivgi/kling-v3.0-std/image-to-video")
      : (T2V_MODEL_MAP[model] || "bytedance/seedance-2.0/text-to-video");

    const resolution = RESOLUTION_MAP[quality as string] || "720p";
    const dur = Math.min(15, Math.max(4, Number(duration) || 5));

    const input: Record<string, unknown> = {
      prompt,
      duration: dur,
      resolution,
      aspect_ratio: aspectRatio || "16:9",
    };

    if (isI2V) {
      input.image_url = imageUrl;
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
