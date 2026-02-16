import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { code, orderTotal } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: promo, error } = await supabase
      .from("promotions")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .single() as { data: any; error: any };

    if (error || !promo) {
      return NextResponse.json({ error: "Code promo invalide" }, { status: 404 });
    }

    // Check dates
    const now = new Date();
    if (promo.starts_at && new Date(promo.starts_at) > now) {
      return NextResponse.json({ error: "Ce code promo n'est pas encore actif" }, { status: 400 });
    }
    if (promo.ends_at && new Date(promo.ends_at) < now) {
      return NextResponse.json({ error: "Ce code promo a expiré" }, { status: 400 });
    }

    // Check minimum order amount
    if (promo.min_order_amount && orderTotal < promo.min_order_amount) {
      return NextResponse.json(
        { error: `Montant minimum de commande : ${promo.min_order_amount}€` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      promotion: {
        code: promo.code,
        name: promo.name,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
      },
    });
  } catch {
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
