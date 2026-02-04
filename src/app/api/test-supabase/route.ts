import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  const { data, error } = await supabase.from("goals").select("*");

  return Response.json({ data, error });
}