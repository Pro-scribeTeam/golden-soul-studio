import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const buffer = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from("studio-uploads")
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (error) throw new Error(error.message);

    const { data: { publicUrl } } = supabase.storage
      .from("studio-uploads")
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
