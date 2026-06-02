import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const model            = (formData.get("model") as string) || "wavespeed-ai/steady-dancer";
    const characterImageUrl = formData.get("characterImageUrl") as string;
    const motionVideoUrl    = formData.get("motionVideoUrl") as string;
    const motionPreset      = formData.get("motionPreset") as string;
    const identityStrength  = Number(formData.get("identityStrength") || 75);
    const motionIntensity   = Number(formData.get("motionIntensity") || 75);

    const result = await callWavespeed(model, {
      image_url:         characterImageUrl,
      video_url:         motionVideoUrl,
      motion_preset:     motionPreset,
      identity_strength: identityStrength / 100,
      motion_strength:   motionIntensity / 100,
    });

    const requestId = result.data?.id || result.id;
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
