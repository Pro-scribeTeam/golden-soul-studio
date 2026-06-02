import { NextRequest, NextResponse } from "next/server";
import { saveOutput } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const record = await saveOutput(body);
    return NextResponse.json(record);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
