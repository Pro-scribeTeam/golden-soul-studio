import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const model = formData.get("model") as string;
    const characterImageUrl = formData.get("characterImageUrl") as string;
    const motionVideoUrl = formData.get("motionVideoUrl") as string;
    const identityStrength = Number(formData.get("identityStrength") || 75);
    const motionIntensity = Number(formData.get("motionIntensity") || 75);

    const apiKey = process.env.WAVESPEED_API_KEY;
    if (!apiKey) throw new Error("WAVESPEED_API_KEY not configured");

    const payload: Record<string, unknown> = {
      model: model || "wavespeed-ai/steady-dancer",
      input: {
        image_url: characterImageUrl,
        video_url: motionVideoUrl,
        identity_strength: identityStrength / 100,
        motion_strength: motionIntensity / 100,
      },
    };

    const res = await fetch("https://api.wavespeed.ai/api/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
