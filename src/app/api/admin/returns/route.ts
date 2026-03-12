import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Lister toutes les demandes de retour (admin uniquement)
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier que c'est un admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const { data: returns, error } = await supabase
      .from("return_requests")
      .select(`
        *,
        orders(order_number, total),
        profiles(first_name, last_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[ADMIN RETURNS] Error fetching returns:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("[ADMIN RETURNS] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
