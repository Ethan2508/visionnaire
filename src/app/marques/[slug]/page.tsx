import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import BrandDetailClient from "./BrandDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: brand } = await supabase
    .from("brands")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (!brand) return { title: "Marque introuvable" };

  return {
    title: brand.name,
    description: brand.description || `Découvrez la collection ${brand.name} chez Visionnaire Opticiens. Lunettes de vue et soleil de luxe à Lyon.`,
    openGraph: {
      title: `${brand.name} | Visionnaire Opticiens`,
      description: brand.description || `Collection ${brand.name} — lunettes de vue et soleil de luxe.`,
      type: "website",
    },
  };
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_price: number;
  brands: { name: string } | null;
  product_images: { url: string; is_primary: boolean }[];
  product_variants: { price_override: number | null; is_active: boolean }[];
}

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

export default async function BrandDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: brand } = await supabase
    .from("brands")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single() as { data: Brand | null };

  if (!brand) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, slug, category, base_price, brands(name), product_images(url, is_primary), product_variants(price_override, is_active)")
    .eq("brand_id", brand.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false }) as { data: Product[] | null };

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Brand",
    name: brand.name,
    description: brand.description,
    logo: brand.logo_url,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <BrandDetailClient brand={brand} initialProducts={products || []} />
    </>
  );
}
