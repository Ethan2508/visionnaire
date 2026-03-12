import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET: Récupérer les demandes de retour de l'utilisateur
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { data: returns, error } = await supabase
      .from("return_requests")
      .select(`
        *,
        orders(order_number)
      `)
      .eq("profile_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[RETURNS] Error fetching returns:", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ returns });
  } catch (error) {
    console.error("[RETURNS] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST: Créer une demande de retour
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, reason, items } = body;

    // Validation
    if (!orderId || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier que la commande appartient à l'utilisateur et est éligible au retour
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("id, status, profile_id, created_at")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const order = orderData as { id: string; status: string; profile_id: string; created_at: string };

    if (order.profile_id !== user.id) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    // Vérifier que la commande est livrée
    if (order.status !== "livree") {
      return NextResponse.json({ error: "Seules les commandes livrées peuvent faire l'objet d'un retour" }, { status: 400 });
    }

    // Vérifier le délai de retour (14 jours)
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 14) {
      return NextResponse.json({ error: "Le délai de retour de 14 jours est dépassé" }, { status: 400 });
    }

    // Vérifier qu'il n'y a pas déjà une demande de retour en cours pour cette commande
    const { data: existingReturn } = await supabase
      .from("return_requests")
      .select("id, status")
      .eq("order_id", orderId)
      .not("status", "in", '("refuse","rembourse")')
      .maybeSingle();

    if (existingReturn) {
      return NextResponse.json({ error: "Une demande de retour est déjà en cours pour cette commande" }, { status: 400 });
    }

    // Créer la demande de retour
    const { data: returnRequest, error: insertError } = await supabase
      .from("return_requests")
      .insert({
        order_id: orderId,
        profile_id: user.id,
        reason,
        items,
        status: "demande",
      } as never)
      .select()
      .single();

    if (insertError) {
      console.error("[RETURNS] Error creating return:", insertError);
      return NextResponse.json({ error: "Erreur lors de la création de la demande" }, { status: 500 });
    }

    return NextResponse.json({ success: true, returnRequest });
  } catch (error) {
    console.error("[RETURNS] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
