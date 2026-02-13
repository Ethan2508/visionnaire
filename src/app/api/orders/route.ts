import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { OrderStatus, DeliveryMethod, PaymentMethod, LensType } from "@/types/database";

interface OrderInsert {
  order_number: string;
  profile_id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  subtotal: number;
  shipping_cost: number;
  total: number;
  shipping_first_name: string | null;
  shipping_last_name: string | null;
  shipping_street: string | null;
  shipping_street_2: string | null;
  shipping_city: string | null;
  shipping_postal_code: string | null;
  shipping_country: string | null;
}

interface OrderItemInsert {
  order_id: string;
  variant_id: string;
  product_name: string;
  variant_info: string | null;
  quantity: number;
  unit_price: number;
  lens_type: LensType | null;
  lens_options_summary: string | null;
  lens_options_price: number;
  prescription_url: string | null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, deliveryMethod, shippingAddress, paymentMethod } = body;

  // Créer le client Supabase (sans generic Database pour éviter l'incompatibilité PostgREST v12)
  const cookiesToSet: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie") || "";
          return cookieHeader.split(";").map((c) => {
            const [name, ...rest] = c.trim().split("=");
            return { name, value: rest.join("=") };
          }).filter(c => c.name);
        },
        setAll(cookies) {
          cookiesToSet.push(...cookies);
        },
      },
    }
  );

  // Vérifier l'authentification
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  // Calculer les totaux
  let subtotal = 0;
  const orderItems: Omit<OrderItemInsert, "order_id">[] = [];

  for (const item of items) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("price_override, products(base_price)")
      .eq("id", item.variantId)
      .single();

    if (!variant) {
      return NextResponse.json({ error: `Variante ${item.variantId} introuvable` }, { status: 400 });
    }

    const v = variant as unknown as { price_override: number | null; products: { base_price: number } | null };
    const unitPrice = Number(v.price_override ?? v.products?.base_price ?? 0);
    const lensPrice = item.lensOptions?.reduce((sum: number, opt: { price: number }) => sum + opt.price, 0) || 0;
    const itemTotal = (unitPrice + lensPrice) * item.quantity;
    subtotal += itemTotal;

    orderItems.push({
      variant_id: item.variantId,
      product_name: item.productName,
      variant_info: `${item.colorName}${item.size ? ` - ${item.size}` : ""}`,
      quantity: item.quantity,
      unit_price: unitPrice,
      lens_type: item.lensType || null,
      lens_options_summary: item.lensOptions?.map((o: { name: string }) => o.name).join(", ") || null,
      lens_options_price: lensPrice || 0,
      prescription_url: item.prescriptionUrl || null,
    });
  }

  const shippingCost = deliveryMethod === "domicile" && subtotal < 150 ? 6.90 : 0;
  const total = subtotal + shippingCost;

  // Générer le numéro de commande
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });
  const orderNumber = `VO-${year}-${String((count || 0) + 1).padStart(4, "0")}`;

  // Créer la commande
  const orderData: OrderInsert = {
    order_number: orderNumber,
    profile_id: user.id,
    status: "en_attente_paiement",
    delivery_method: deliveryMethod || "domicile",
    payment_method: paymentMethod || "stripe",
    subtotal,
    shipping_cost: shippingCost,
    total,
    shipping_first_name: shippingAddress?.firstName || null,
    shipping_last_name: shippingAddress?.lastName || null,
    shipping_street: shippingAddress?.street || null,
    shipping_street_2: shippingAddress?.street2 || null,
    shipping_city: shippingAddress?.city || null,
    shipping_postal_code: shippingAddress?.postalCode || null,
    shipping_country: shippingAddress?.country || "France",
  };

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderData as never)
    .select("id, order_number")
    .single();

  if (orderError || !order) {
    console.error("[ORDER] Error creating order:", orderError);
    return NextResponse.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
  }

  const o = order as { id: string; order_number: string };

  // Créer les articles de la commande
  const itemsWithOrderId: OrderItemInsert[] = orderItems.map((item) => ({
    ...item,
    order_id: o.id,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(itemsWithOrderId as never[]);

  if (itemsError) {
    console.error("[ORDER] Error creating order items:", itemsError);
    return NextResponse.json({ error: "Erreur lors de la création des articles" }, { status: 500 });
  }

  // Ajouter au historique des statuts
  await supabase.from("order_status_history").insert({
    order_id: o.id,
    status: "en_attente_paiement",
    comment: "Commande créée",
  } as never);

  const response = NextResponse.json({
    success: true,
    orderId: o.id,
    orderNumber: o.order_number,
    total,
  });

  for (const { name, value, options } of cookiesToSet) {
    response.cookies.set(name, value, options);
  }

  return response;
}
