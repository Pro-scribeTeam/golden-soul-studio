import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: NextRequest) {
  try {
    const filename = req.nextUrl.searchParams.get("filename");
    if (!filename) return NextResponse.json({ error: "Missing filename" }, { status: 400 });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) throw new Error("Supabase not configured");

    const supabase = createClient(supabaseUrl, supabaseKey);

    const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { data, error } = await supabase.storage
      .from("studio-uploads")
      .createSignedUploadUrl(path);

    if (error || !data) throw new Error(error?.message ?? "Failed to create signed URL");

    const { data: { publicUrl } } = supabase.storage
      .from("studio-uploads")
      .getPublicUrl(path);

    return NextResponse.json({ signedUrl: data.signedUrl, path, publicUrl });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
