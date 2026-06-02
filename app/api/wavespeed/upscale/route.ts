import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

// wavespeed-ai/image-upscaler — verified June 2026
// target_resolution: "2k" | "4k" | "8k"
export async function POST(req: NextRequest) {
  try {
    const { imageUrl, resolution } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const target = ["2k", "4k", "8k"].includes(resolution) ? resolution : "4k";

    const result = await callWavespeed("wavespeed-ai/image-upscaler", {
      image: imageUrl,
      target_resolution: target,
      output_format: "jpeg",
    });

    const requestId = result.data?.id || result.id;
    if (!requestId) throw new Error("No request ID returned from WaveSpeed");
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
