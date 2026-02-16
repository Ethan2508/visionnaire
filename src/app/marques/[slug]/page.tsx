"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import ProductCard from "@/components/catalogue/ProductCard";
import { ChevronRight } from "lucide-react";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_price: number;
  requires_prescription: boolean;
  brands: { name: string } | null;
  product_images: { url: string; is_primary: boolean }[];
  product_variants: { price_override: number | null; is_active: boolean }[];
}

export default function BrandDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [brand, setBrand] = useState<Brand | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const supabase = createClient();

      // Charger la marque
      const { data: brandData } = (await supabase
        .from("brands")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single()) as { data: Brand | null };

      if (brandData) {
        setBrand(brandData);

        // Charger les produits de cette marque
        const { data: productsData } = (await supabase
          .from("products")
          .select("id, name, slug, category, base_price, requires_prescription, brands(name), product_images(url, is_primary), product_variants(price_override, is_active)")
          .eq("brand_id", brandData.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })) as { data: Product[] | null };

        setProducts(productsData || []);
      }
      setLoading(false);
    }
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-stone-200 rounded w-48 mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200">
              <div className="aspect-square bg-stone-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-stone-100 rounded w-2/3" />
                <div className="h-4 bg-stone-100 rounded w-1/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-stone-900 mb-4">Marque non trouvee</h1>
        <Link href="/marques" className="text-stone-600 hover:text-stone-900 underline">
          Voir toutes les marques
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1 text-sm text-stone-500 mb-6">
        <Link href="/marques" className="hover:text-stone-900">Marques</Link>
        <ChevronRight size={14} />
        <span className="text-stone-900">{brand.name}</span>
      </nav>

      {/* En-tête marque */}
      <div className="flex items-center gap-6 mb-8">
        {brand.logo_url && (
          <div className="w-20 h-20 bg-white rounded-xl border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
            <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-2" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-bold text-stone-900">{brand.name}</h1>
          {brand.description && (
            <p className="text-stone-500 mt-1 max-w-2xl">{brand.description}</p>
          )}
          <p className="text-sm text-stone-400 mt-1">
            {products.length} produit{products.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Produits */}
      {products.length === 0 ? (
        <p className="text-stone-500 text-center py-16">
          Aucun produit disponible pour cette marque.
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((product) => {
              const lowestVariantPrice = product.product_variants
                ?.filter((v) => v.is_active && v.price_override != null)
                .reduce((min, v) => Math.min(min, v.price_override!), Infinity);
              const displayPrice = lowestVariantPrice !== Infinity ? lowestVariantPrice : product.base_price;
              const compareAt = lowestVariantPrice !== Infinity && lowestVariantPrice < product.base_price ? product.base_price : undefined;
              return (
              <ProductCard
                key={product.id}
                slug={product.slug}
                name={product.name}
                brandName={product.brands?.name}
                price={displayPrice}
                compareAtPrice={compareAt}
                images={product.product_images}
                category={product.category}
                requiresPrescription={product.requires_prescription}
              />
              );
          })}
        </div>
      )}
    </div>
  );
}
