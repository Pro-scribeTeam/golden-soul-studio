import { NextRequest, NextResponse } from "next/server";
import { callWavespeed } from "@/lib/wavespeed";

// wavespeed-ai/image-background-remover — verified June 2026
export async function POST(req: NextRequest) {
  try {
    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return NextResponse.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const result = await callWavespeed("wavespeed-ai/image-background-remover", {
      image: imageUrl,
    });

    const requestId = result.data?.id || result.id;
    if (!requestId) throw new Error("No request ID returned from WaveSpeed");
    return NextResponse.json({ requestId, status: "processing" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
