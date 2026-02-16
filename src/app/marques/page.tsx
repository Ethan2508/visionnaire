import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";
import BrandsPageClient from "./BrandsPageClient";

export const metadata: Metadata = {
  title: "Nos marques",
  description:
    "Découvrez les marques que nous avons sélectionnées pour vous : lunettes de vue et soleil des plus grandes maisons de luxe. Cartier, Gucci, Prada, Fred, Dior et plus.",
  openGraph: {
    title: "Nos marques | Visionnaire Opticiens",
    description:
      "Découvrez les marques que nous avons sélectionnées pour vous : lunettes de vue et soleil des plus grandes maisons de luxe.",
    type: "website",
  },
};

export default async function BrandsPage() {
  let brands: { id: string; name: string; slug: string; description: string | null; logo_url: string | null }[] = [];

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("brands")
      .select("id, name, slug, description, logo_url")
      .eq("is_active", true)
      .order("sort_order")
      .order("name");

    brands = data || [];
  } catch {
    // Fail silently
  }

  return <BrandsPageClient initialBrands={brands} />;
}
