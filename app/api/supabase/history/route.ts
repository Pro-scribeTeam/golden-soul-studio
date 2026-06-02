import { NextRequest, NextResponse } from "next/server";
import { getOutputs, deleteOutput } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    const section = req.nextUrl.searchParams.get("section") || undefined;
    const data = await getOutputs(section);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await deleteOutput(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
