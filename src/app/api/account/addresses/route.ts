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
    .eq("user_id", user.id)
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
  const { label, firstName, lastName, street, street2, city, postalCode, country, isDefault } = body;

  // If this is the default address, unset all other defaults
  if (isDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false } as never)
      .eq("user_id", user.id);
  }

  const { data: newAddress, error } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      label,
      first_name: firstName,
      last_name: lastName,
      street,
      street_2: street2 || null,
      city,
      postal_code: postalCode,
      country: country || "France",
      is_default: isDefault || false,
    } as never)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ address: newAddress });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, label, firstName, lastName, street, street2, city, postalCode, country, isDefault } = body;

  // If this is the default address, unset all other defaults
  if (isDefault) {
    await supabase
      .from("addresses")
      .update({ is_default: false } as never)
      .eq("user_id", user.id)
      .neq("id", id);
  }

  const { data: updatedAddress, error } = await supabase
    .from("addresses")
    .update({
      label,
      first_name: firstName,
      last_name: lastName,
      street,
      street_2: street2 || null,
      city,
      postal_code: postalCode,
      country: country || "France",
      is_default: isDefault || false,
    } as never)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ address: updatedAddress });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing ID" }, { status: 400 });
  }

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
