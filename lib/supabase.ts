import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (!_client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase environment variables not configured");
    }
    _client = createClient(supabaseUrl, supabaseServiceKey);
  }
  return _client;
}

export interface StudioOutput {
  id?: string;
  section: string;
  model: string;
  prompt?: string;
  settings?: Record<string, unknown>;
  output_url?: string;
  thumbnail_url?: string;
  created_at?: string;
  user_id?: string;
}

export async function saveOutput(output: StudioOutput) {
  const { data, error } = await getClient()
    .from("studio_outputs")
    .insert({ ...output, user_id: output.user_id || "jeff_dixon" })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getOutputs(section?: string) {
  let query = getClient()
    .from("studio_outputs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (section && section !== "all") {
    query = query.eq("section", section);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function deleteOutput(id: string) {
  const { error } = await getClient()
    .from("studio_outputs")
    .delete()
    .eq("id", id);
  if (error) throw error;
}
