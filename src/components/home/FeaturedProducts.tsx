"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShoppingBag } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

interface ProductImage {
  url: string;
  alt_text: string | null;
  is_primary: boolean;
}

interface FeaturedProduct {
  id: string;
  name: string;
  slug: string;
  base_price: number;
  category: string;
  gender: string;
  brand_id: string | null;
  brands: { name: string; slug: string } | null;
  product_images: ProductImage[];
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [type, setType] = useState<string>("featured");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/products/featured");
        const data = await res.json();
        setProducts(data.products || []);
        setType(data.type || "featured");
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-stone-100 rounded-sm" />
              <div className="mt-4 h-3 bg-stone-100 rounded w-1/3" />
              <div className="mt-2 h-4 bg-stone-100 rounded w-2/3" />
              <div className="mt-2 h-3 bg-stone-100 rounded w-1/4" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  const title =
    type === "personalized"
      ? "Recommandé pour vous"
      : type === "featured"
      ? "Nos coups de cœur"
      : "Nouveautés";

  const subtitle =
    type === "personalized"
      ? "Sélectionné selon vos goûts"
      : type === "featured"
      ? "La sélection de nos opticiens"
      : "Les dernières arrivées";

  return (
    <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      <AnimatedSection>
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              {subtitle}
            </span>
            <h2 className="text-3xl md:text-4xl font-light text-stone-900 mt-2">
              {title.split(" ").slice(0, -1).join(" ")}{" "}
              <span className="font-semibold">{title.split(" ").slice(-1)}</span>
            </h2>
          </div>
          <Link
            href="/catalogue"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-black transition-colors group"
          >
            Tout voir{" "}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </AnimatedSection>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
        {products.slice(0, 8).map((product, index) => {
          const primaryImage = product.product_images?.find(
            (img) => img.is_primary
          );
          const image = primaryImage || product.product_images?.[0];

          return (
            <AnimatedSection key={product.id} delay={index * 80}>
              <Link
                href={`/catalogue/${product.slug}`}
                className="group block"
              >
                <div className="relative aspect-square bg-stone-50 rounded-sm overflow-hidden">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt_text || product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ShoppingBag
                        size={32}
                        className="text-stone-200"
                      />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500" />
                </div>
                <div className="mt-4">
                  {product.brands && (
                    <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-stone-400">
                      {product.brands.name}
                    </span>
                  )}
                  <h3 className="text-sm font-medium text-stone-900 mt-0.5 group-hover:text-stone-600 transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-stone-500 mt-1">
                    {product.base_price.toLocaleString("fr-FR")} €
                  </p>
                </div>
              </Link>
            </AnimatedSection>
          );
        })}
      </div>

      <div className="text-center mt-12 sm:hidden">
        <Link
          href="/catalogue"
          className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-black transition-colors"
        >
          Tout voir <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
