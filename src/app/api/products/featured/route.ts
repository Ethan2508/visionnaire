import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Try to get current user for personalized recommendations
  let userId: string | null = null;
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            const cookieHeader = request.headers.get("cookie") || "";
            return cookieHeader
              .split(";")
              .map((c) => {
                const [name, ...rest] = c.trim().split("=");
                return { name, value: rest.join("=") };
              })
              .filter((c) => c.name);
          },
          setAll() {},
        },
      }
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    // Not logged in - that's fine
  }

  // If user is logged in, try to get personalized recommendations
  if (userId) {
    // Get brands and categories from past orders via a proper join
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id")
      .eq("profile_id", userId)
      .limit(20);

    const orderIds = orders?.map((o) => o.id) || [];

    let orderItems: { product_id: string; products: unknown }[] = [];
    if (orderIds.length > 0) {
      const { data } = await supabaseAdmin
        .from("order_items")
        .select("product_id, products(brand_id, category, gender)")
        .in("order_id", orderIds)
        .limit(20);
      orderItems = (data || []) as typeof orderItems;
    }

    if (orderItems.length > 0) {
      const brandIds = new Set<string>();
      const categories = new Set<string>();
      for (const item of orderItems) {
        const product = item.products as unknown as {
          brand_id: string | null;
          category: string;
          gender: string;
        };
        if (product?.brand_id) brandIds.add(product.brand_id);
        if (product?.category) categories.add(product.category);
      }

      // Get similar products the user hasn't ordered
      const orderedProductIds = orderItems.map((i) => i.product_id);
      const { data: recommended } = await supabaseAdmin
        .from("products")
        .select(
          "id, name, slug, base_price, category, gender, brand_id, brands(name, slug), product_images(url, alt_text, is_primary)"
        )
        .eq("is_active", true)
        .not("id", "in", `(${orderedProductIds.join(",")})`)
        .or(
          [
            ...Array.from(brandIds).map((id) => `brand_id.eq.${id}`),
            ...Array.from(categories).map((c) => `category.eq.${c}`),
          ].join(",")
        )
        .order("is_featured", { ascending: false })
        .limit(8);

      if (recommended && recommended.length >= 4) {
        return NextResponse.json({
          products: recommended,
          type: "personalized",
        });
      }
    }
  }

  // Fallback: featured products
  const { data: featured } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, base_price, category, gender, brand_id, brands(name, slug), product_images(url, alt_text, is_primary)"
    )
    .eq("is_active", true)
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);

  if (featured && featured.length > 0) {
    return NextResponse.json({ products: featured, type: "featured" });
  }

  // Final fallback: latest products
  const { data: latest } = await supabaseAdmin
    .from("products")
    .select(
      "id, name, slug, base_price, category, gender, brand_id, brands(name, slug), product_images(url, alt_text, is_primary)"
    )
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(8);

  return NextResponse.json({ products: latest || [], type: "latest" });
}
