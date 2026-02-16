import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const ALMA_API_KEY = process.env.ALMA_API_KEY!;
const ALMA_API_URL = "https://api.getalma.eu/v1";

// Utiliser le service role pour les webhooks (pas de cookies/session)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const paymentId = body.id || body.payment_id;

    if (!paymentId) {
      console.error("[ALMA WEBHOOK] Missing payment ID in body:", body);
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    console.log(`[ALMA WEBHOOK] Received IPN for payment: ${paymentId}`);

    // Récupérer le statut du paiement chez Alma
    const almaResponse = await fetch(`${ALMA_API_URL}/payments/${paymentId}`, {
      headers: {
        "Authorization": `Alma-Auth ${ALMA_API_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!almaResponse.ok) {
      console.error("[ALMA WEBHOOK] Failed to fetch payment:", almaResponse.status);
      return NextResponse.json({ error: "Failed to fetch payment" }, { status: 500 });
    }

    const almaPayment = await almaResponse.json();
    const almaState = almaPayment.state;
    const orderId = almaPayment.custom_data?.order_id;

    console.log(`[ALMA WEBHOOK] Payment ${paymentId} state: ${almaState}, order: ${orderId}`);

    if (!orderId) {
      console.error("[ALMA WEBHOOK] No order_id in custom_data");
      return NextResponse.json({ error: "No order_id" }, { status: 400 });
    }

    // Mapper les états Alma vers nos statuts de commande
    let newStatus: string | null = null;

    switch (almaState) {
      case "in_progress":
        // Paiement accepté, première échéance payée
        newStatus = "payee";
        break;
      case "paid":
        // Toutes les échéances payées
        newStatus = "payee";
        break;
      case "refunded":
        newStatus = "remboursee";
        break;
      case "default":
        // Impayé — on garde la commande payée mais on logue
        console.warn(`[ALMA WEBHOOK] Payment ${paymentId} in default state`);
        break;
      default:
        console.log(`[ALMA WEBHOOK] Unhandled state: ${almaState}`);
        break;
    }

    if (newStatus) {
      // Vérifier le statut actuel de la commande
      const { data: order } = await supabase
        .from("orders")
        .select("status")
        .eq("id", orderId)
        .single();

      // Ne mettre à jour que si la commande est en attente de paiement
      if (order && order.status === "en_attente_paiement") {
        const { error: updateError } = await supabase
          .from("orders")
          .update({ status: newStatus } as never)
          .eq("id", orderId);

        if (updateError) {
          console.error("[ALMA WEBHOOK] Failed to update order:", updateError);
          return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
        }

        // Ajouter une entrée dans l'historique des statuts
        await supabase
          .from("order_status_history")
          .insert({
            order_id: orderId,
            status: newStatus,
            comment: `Paiement Alma confirmé (${almaState}) — ID: ${paymentId}`,
          } as never);

        console.log(`[ALMA WEBHOOK] Order ${orderId} updated to ${newStatus}`);
      } else {
        console.log(`[ALMA WEBHOOK] Order ${orderId} already in state: ${order?.status}, skipping`);
      }
    }

    // Alma attend un 200 pour confirmer la réception
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ALMA WEBHOOK] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
