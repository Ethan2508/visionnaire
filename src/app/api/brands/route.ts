import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase
    .from("brands")
    .select("id, name, slug, description, logo_url")
    .eq("is_active", true)
    .order("sort_order")
    .order("name");

  if (error) {
    return NextResponse.json({ brands: [] });
  }

  return NextResponse.json({ brands: data || [] });
}
