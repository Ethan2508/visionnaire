import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALMA_API_KEY = process.env.ALMA_API_KEY!;
const ALMA_API_URL = "https://api.getalma.eu/v1";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaire-opticiens.fr";

export async function POST(request: NextRequest) {
  try {
    const { orderId, installments } = await request.json();

    if (!orderId || !installments) {
      return NextResponse.json({ error: "orderId et installments requis" }, { status: 400 });
    }

    if (![1, 2, 3, 4, 12].includes(installments)) {
      return NextResponse.json({ error: "Nombre d'échéances invalide (1, 2, 3, 4 ou 12)" }, { status: 400 });
    }

    const supabase = await createClient();

    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Récupérer la commande
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("*, profiles(first_name, last_name, email, phone)")
      .eq("id", orderId)
      .eq("profile_id", user.id)
      .single() as { data: any; error: any };

    if (orderError || !order) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    if (order.status !== "en_attente_paiement") {
      return NextResponse.json({ error: "Cette commande a déjà été payée" }, { status: 400 });
    }

    // Créer le paiement Alma
    // Alma attend les montants en centimes
    const purchaseAmountCents = Math.round(order.total * 100);

    const almaPayload = {
      payment: {
        purchase_amount: purchaseAmountCents,
        installments_count: installments,
        return_url: `${SITE_URL}/panier/checkout/alma-retour?orderId=${orderId}`,
        customer_cancel_url: `${SITE_URL}/panier/checkout?cancelled=true`,
        ipn_callback_url: `${SITE_URL}/api/alma/webhook`,
        locale: "fr",
        custom_data: {
          order_id: orderId,
          order_number: order.order_number,
        },
      },
      customer: {
        first_name: order.profiles?.first_name || "",
        last_name: order.profiles?.last_name || "",
        email: order.profiles?.email || user.email || "",
        phone: order.profiles?.phone || undefined,
      },
      order: {
        merchant_reference: order.order_number,
      },
    };

    // Si adresse de livraison disponible
    if (order.shipping_street) {
      Object.assign(almaPayload, {
        shipping_address: {
          first_name: order.shipping_first_name,
          last_name: order.shipping_last_name,
          line1: order.shipping_street,
          line2: order.shipping_street_2 || undefined,
          postal_code: order.shipping_postal_code,
          city: order.shipping_city,
          country: order.shipping_country || "FR",
        },
      });
    }

    const almaResponse = await fetch(`${ALMA_API_URL}/payments`, {
      method: "POST",
      headers: {
        "Authorization": `Alma-Auth ${ALMA_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(almaPayload),
    });

    if (!almaResponse.ok) {
      const errorData = await almaResponse.json().catch(() => ({}));
      console.error("[ALMA] Error creating payment:", almaResponse.status, errorData);
      return NextResponse.json(
        { error: "Erreur lors de la création du paiement Alma. Veuillez réessayer." },
        { status: 500 }
      );
    }

    const almaPayment = await almaResponse.json();

    // Sauvegarder l'ID du paiement Alma dans la commande
    await supabase
      .from("orders")
      .update({
        alma_payment_id: almaPayment.id,
        payment_method: "alma",
      } as never)
      .eq("id", orderId);

    return NextResponse.json({
      success: true,
      paymentUrl: almaPayment.url,
      paymentId: almaPayment.id,
    });
  } catch (error) {
    console.error("[ALMA] Unexpected error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
