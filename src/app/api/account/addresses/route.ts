import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: addresses } = await supabase
    .from("addresses")
    .select("*")
    .eq("profile_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  return NextResponse.json({ addresses: addresses || [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { label, first_name, last_name, street, street_2, city, postal_code, country, is_default } = body;

  // If this is the default address, unset all other defaults
  if (is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false } as never)
      .eq("profile_id", user.id);
  }

  const { data: newAddress, error } = await supabase
    .from("addresses")
    .insert({
      profile_id: user.id,
      label,
      first_name,
      last_name,
      street,
      street_2: street_2 || null,
      city,
      postal_code,
      country: country || "France",
      is_default: is_default || false,
    } as never)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(newAddress);
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, label, first_name, last_name, street, street_2, city, postal_code, country, is_default } = body;

  // If this is the default address, unset all other defaults
  if (is_default) {
    await supabase
      .from("addresses")
      .update({ is_default: false } as never)
      .eq("profile_id", user.id)
      .neq("id", id);
  }

  const { data: updatedAddress, error } = await supabase
    .from("addresses")
    .update({
      label,
      first_name,
      last_name,
      street,
      street_2: street_2 || null,
      city,
      postal_code,
      country: country || "France",
      is_default: is_default || false,
    } as never)
    .eq("id", id)
    .eq("profile_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(updatedAddress);
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = body?.id;

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
