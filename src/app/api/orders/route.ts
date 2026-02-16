import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { OrderStatus, DeliveryMethod, PaymentMethod } from "@/types/database";
import { SHIPPING_COST, FREE_SHIPPING_THRESHOLD } from "@/lib/utils";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { orderConfirmationEmail } from "@/lib/emails";

interface OrderInsert {
  order_number: string;
  profile_id: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  payment_method: PaymentMethod;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  promo_code: string | null;
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
}

export async function POST(request: Request) {
  const body = await request.json();
  const { items, deliveryMethod, shippingAddress, paymentMethod, promoCode } = body;

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

  if (!items || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Panier vide" }, { status: 400 });
  }

  // S5: Validate quantities — must be positive integers
  for (const item of items) {
    if (!item.variantId || typeof item.variantId !== "string") {
      return NextResponse.json({ error: "Variante invalide" }, { status: 400 });
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 10) {
      return NextResponse.json({ error: "Quantité invalide (1-10 par article)" }, { status: 400 });
    }
  }

  // Calculer les totaux — batch fetch all variants at once (fix N+1)
  let subtotal = 0;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderItems: Record<string, any>[] = [];

  const variantIds = items.map((i: { variantId: string }) => i.variantId);
  const { data: variants } = await supabase
    .from("product_variants")
    .select("id, price_override, products(base_price)")
    .in("id", variantIds);

  if (!variants || variants.length === 0) {
    return NextResponse.json({ error: "Variantes introuvables" }, { status: 400 });
  }

  const variantMap = new Map<string, { price_override: number | null; products: { base_price: number } | null }>();
  for (const v of variants) {
    variantMap.set(v.id, v as unknown as { price_override: number | null; products: { base_price: number } | null });
  }

  for (const item of items) {
    const variant = variantMap.get(item.variantId);
    if (!variant) {
      return NextResponse.json({ error: `Variante ${item.variantId} introuvable` }, { status: 400 });
    }

    const unitPrice = Number(variant.price_override ?? variant.products?.base_price ?? 0);
    const itemTotal = unitPrice * item.quantity;
    subtotal += itemTotal;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderItem: Record<string, any> = {
      variant_id: item.variantId,
      product_name: item.productName,
      variant_info: `${item.colorName}${item.size ? ` - ${item.size}` : ""}`,
      quantity: item.quantity,
      unit_price: unitPrice,
    };
    orderItems.push(orderItem);
  }

  // Promo code discount
  let discountAmount = 0;
  if (promoCode) {
    const { data: promo } = await supabase
      .from("promotions")
      .select("*")
      .eq("code", promoCode.toUpperCase())
      .eq("is_active", true)
      .single();

    if (promo) {
      const now = new Date();
      const validStart = !promo.starts_at || new Date(promo.starts_at) <= now;
      const validEnd = !promo.ends_at || new Date(promo.ends_at) >= now;
      const validMin = !promo.min_order_amount || subtotal >= promo.min_order_amount;

      if (validStart && validEnd && validMin) {
        if (promo.discount_type === "percentage") {
          discountAmount = subtotal * (promo.discount_value / 100);
        } else {
          discountAmount = Math.min(promo.discount_value, subtotal);
        }
      }
    }
  }

  const shippingCost = deliveryMethod === "domicile" && subtotal < FREE_SHIPPING_THRESHOLD ? SHIPPING_COST : 0;
  const total = subtotal - discountAmount + shippingCost;

  // Générer le numéro de commande (with random suffix to avoid race conditions)
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true });
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  const orderNumber = `VO-${year}-${String((count || 0) + 1).padStart(4, "0")}-${random}`;

  // Créer la commande
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orderData: Record<string, any> = {
    order_number: orderNumber,
    profile_id: user.id,
    status: "en_attente_paiement",
    delivery_method: deliveryMethod || "domicile",
    payment_method: paymentMethod || "alma",
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

  // Ajouter les champs optionnels (colonnes qui peuvent ne pas encore exister)
  if (discountAmount > 0) orderData.discount_amount = discountAmount;
  if (promoCode) orderData.promo_code = promoCode;

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
  const itemsWithOrderId = orderItems.map((item) => ({
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

  // Sauvegarder l'adresse de livraison dans le profil si livraison à domicile
  if (deliveryMethod === "domicile" && shippingAddress) {
    try {
      // Vérifier si une adresse identique existe déjà
      const { data: existingAddresses } = await supabase
        .from("addresses")
        .select("id")
        .eq("profile_id", user.id)
        .eq("street", shippingAddress.street || "")
        .eq("postal_code", shippingAddress.postalCode || "")
        .eq("city", shippingAddress.city || "")
        .limit(1);

      if (!existingAddresses || existingAddresses.length === 0) {
        // Vérifier s'il y a déjà des adresses (pour is_default)
        const { count: addrCount } = await supabase
          .from("addresses")
          .select("*", { count: "exact", head: true })
          .eq("profile_id", user.id);

        await supabase.from("addresses").insert({
          profile_id: user.id,
          label: "Livraison",
          first_name: shippingAddress.firstName || "",
          last_name: shippingAddress.lastName || "",
          street: shippingAddress.street || "",
          street_2: shippingAddress.street2 || null,
          city: shippingAddress.city || "",
          postal_code: shippingAddress.postalCode || "",
          country: shippingAddress.country || "France",
          is_default: (addrCount || 0) === 0,
        } as never);
      }
    } catch (e) {
      // Non-bloquant : on ne veut pas que l'erreur d'adresse bloque la commande
      console.error("[ORDER] Error saving address:", e);
    }
  }

  // Envoyer l'email de confirmation (non-bloquant)
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, email")
      .eq("id", user.id)
      .single();

    if (profile?.email) {
      const emailData = orderConfirmationEmail({
        orderNumber: o.order_number,
        firstName: profile.first_name || "Client",
        items: orderItems.map((item) => ({
          product_name: item.product_name as string,
          variant_info: item.variant_info as string | null,
          quantity: item.quantity as number,
          unit_price: item.unit_price as number,
        })),
        subtotal,
        shippingCost,
        total,
        deliveryMethod: deliveryMethod || "domicile",
        shippingAddress: shippingAddress
          ? {
              street: shippingAddress.street || "",
              city: shippingAddress.city || "",
              postalCode: shippingAddress.postalCode || "",
            }
          : undefined,
      });

      await resend.emails.send({
        from: EMAIL_FROM,
        to: profile.email,
        subject: emailData.subject,
        html: emailData.html,
      });
    }
  } catch (emailError) {
    // Non-bloquant : ne pas faire échouer la commande si l'email échoue
    console.error("[ORDER] Error sending confirmation email:", emailError);
  }

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
