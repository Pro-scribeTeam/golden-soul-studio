import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const model             = body.model || "wavespeed-ai/steady-dancer";
    const characterImageUrl = body.characterImageUrl as string;
    const motionVideoUrl    = body.motionVideoUrl as string | undefined;
    const motionPreset      = body.motionPreset as string | undefined;
    const identityStrength  = Number(body.identityStrength ?? 75);
    const motionIntensity   = Number(body.motionIntensity ?? 75);

    if (!characterImageUrl) {
      return NextResponse.json({ error: "characterImageUrl is required" }, { status: 400 });
    }

    const input: Record<string, unknown> = {
      image_url:         characterImageUrl,
      identity_strength: identityStrength / 100,
      motion_strength:   motionIntensity / 100,
    };
    if (motionVideoUrl) input.video_url = motionVideoUrl;
    if (motionPreset)   input.motion_preset = motionPreset;

    const result = await callWavespeed(model, input);

    const requestId = result.data?.id || result.id;
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
