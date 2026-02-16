"use client";

import Link from "next/link";
import Image from "next/image";
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
  brands: { name: string } | null;
  product_images: { url: string; is_primary: boolean }[];
  product_variants: { price_override: number | null; is_active: boolean }[];
}

export default function BrandDetailClient({
  brand,
  initialProducts,
}: {
  brand: Brand;
  initialProducts: Product[];
}) {
  const products = initialProducts;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-1 text-sm text-stone-500 mb-6">
        <Link href="/marques" className="hover:text-stone-900">Marques</Link>
        <ChevronRight size={14} />
        <span className="text-stone-900">{brand.name}</span>
      </nav>

      {/* En-tête marque */}
      <div className="flex items-center gap-6 mb-8">
        {brand.logo_url && (
          <div className="w-20 h-20 bg-white rounded-xl border border-stone-200 flex items-center justify-center overflow-hidden shrink-0">
            <Image src={brand.logo_url} alt={brand.name} width={80} height={80} className="w-full h-full object-contain p-2" />
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
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
