import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();

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
