"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import LensConfigurator from "@/components/configurateur/LensConfigurator";

interface Variant {
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string | null;
  price_override: number | null;
  stock_quantity: number;
  is_active: boolean;
}

interface ProductImage {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  requires_prescription: boolean;
  brands: { name: string; slug: string } | null;
  product_variants: Variant[];
  product_images: ProductImage[];
}

export default function ConfigurerPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = (await supabase
        .from("products")
        .select("id, name, slug, base_price, requires_prescription, brands(name, slug), product_variants(*), product_images(*)")
        .eq("slug", slug)
        .eq("is_active", true)
        .single()) as { data: Product | null };

      setProduct(data);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-stone-100 rounded w-48" />
          <div className="h-10 bg-stone-100 rounded w-96" />
          <div className="h-[400px] bg-stone-100 rounded" />
        </div>
      </div>
    );
  }

  if (!product || !product.requires_prescription) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">
          Produit non disponible pour la configuration
        </h1>
        <Link href="/catalogue" className="text-stone-600 hover:text-stone-900 underline">
          Retour au catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <LensConfigurator product={product} />
    </div>
  );
}
