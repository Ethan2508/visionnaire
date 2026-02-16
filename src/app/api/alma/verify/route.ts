import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALMA_API_KEY = process.env.ALMA_API_KEY!;
const ALMA_API_URL = "https://api.getalma.eu/v1";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    if (!orderId) {
      return NextResponse.json({ error: "orderId requis" }, { status: 400 });
    }

    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer la commande (vérifier qu'elle appartient à l'utilisateur)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, status, alma_payment_id")
      .eq("id", orderId)
      .eq("profile_id", user.id)
      .single() as { data: any; error: any };

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    // Si la commande est déjà payée (le webhook a déjà traité)
    if (order.status === "payee" || order.status === "en_preparation") {
      return NextResponse.json({
        success: true,
        orderNumber: order.order_number,
        status: order.status,
      });
    }

    // Si pas encore traitée par le webhook, vérifier directement chez Alma
    if (order.alma_payment_id) {
      const almaResponse = await fetch(`${ALMA_API_URL}/payments/${order.alma_payment_id}`, {
        headers: {
          "Authorization": `Alma-Auth ${ALMA_API_KEY}`,
          "Accept": "application/json",
        },
      });

      if (almaResponse.ok) {
        const almaPayment = await almaResponse.json();

        if (almaPayment.state === "in_progress" || almaPayment.state === "paid") {
          // Mettre à jour la commande si le webhook n'a pas encore traité
          if (order.status === "en_attente_paiement") {
            await supabase
              .from("orders")
              .update({ status: "payee" } as never)
              .eq("id", orderId);

            await supabase
              .from("order_status_history")
              .insert({
                order_id: orderId,
                status: "payee",
                note: `Paiement Alma confirmé (vérifié au retour) — ID: ${order.alma_payment_id}`,
              } as never);
          }

          return NextResponse.json({
            success: true,
            orderNumber: order.order_number,
            status: "payee",
          });
        }
      }
    }

    // Paiement pas encore confirmé
    return NextResponse.json({
      success: false,
      message: "Paiement en attente de confirmation",
    }, { status: 402 });
  } catch (error) {
    console.error("[ALMA VERIFY] Error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
