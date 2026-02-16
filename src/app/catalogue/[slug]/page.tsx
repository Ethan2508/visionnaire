import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import { formatPrice, categoryLabel } from "@/lib/utils";
import ProductDetailClient from "./ProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  variant_id: string | null;
  sort_order?: number;
}

interface Variant {
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string | null;
  price_override: number | null;
  stock_quantity: number;
  is_active: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  gender: string;
  base_price: number;
  frame_shape: string | null;
  frame_material: string | null;
  frame_color: string | null;
  brands: { name: string; slug: string } | null;
  product_variants: Variant[];
  product_images: ProductImage[];
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaireopticiens.vercel.app";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: product } = await supabase
    .from("products")
    .select("name, description, base_price, category, brands(name), product_images(url, is_primary)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!product) return { title: "Produit introuvable" };

  const p = product as unknown as {
    name: string;
    description: string | null;
    base_price: number;
    category: string;
    brands: { name: string } | null;
    product_images: { url: string; is_primary: boolean }[];
  };

  const primaryImage = p.product_images?.find((i) => i.is_primary)?.url || p.product_images?.[0]?.url;
  const brandName = p.brands?.name ? `${p.brands.name} ` : "";

  return {
    title: `${brandName}${p.name}`,
    description: p.description || `${brandName}${p.name} — ${categoryLabel(p.category)} à ${formatPrice(p.base_price)}. Livraison offerte dès 150€. Paiement en 2x, 3x, 4x sans frais.`,
    openGraph: {
      title: `${brandName}${p.name} | Visionnaire Opticiens`,
      description: p.description || `${brandName}${p.name} — ${categoryLabel(p.category)} de luxe.`,
      type: "website",
      images: primaryImage ? [{ url: primaryImage }] : undefined,
    },
    alternates: {
      canonical: `${BASE_URL}/catalogue/${slug}`,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data } = await supabase
    .from("products")
    .select("*, brands(name, slug), product_variants(*), product_images(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .single() as { data: Product | null };

  if (!data) notFound();

  // Sort images: primary first, then by sort_order
  data.product_images.sort((a, b) => {
    if (a.is_primary && !b.is_primary) return -1;
    if (!a.is_primary && b.is_primary) return 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });

  // JSON-LD Product structured data
  const primaryImage = data.product_images.find((i) => i.is_primary)?.url || data.product_images[0]?.url;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: data.name,
    description: data.description,
    image: primaryImage,
    brand: data.brands ? { "@type": "Brand", name: data.brands.name } : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: data.base_price,
      availability: data.product_variants.some((v) => v.is_active && v.stock_quantity > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: { "@type": "Organization", name: "Visionnaire Opticiens" },
    },
    category: categoryLabel(data.category),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailClient product={data} />
    </>
  );
}
