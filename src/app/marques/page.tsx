"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBrands() {
      try {
        const res = await fetch("/api/brands");
        const data = await res.json();
        setBrands(data.brands || []);
      } catch {
        setBrands([]);
      } finally {
        setLoading(false);
      }
    }
    loadBrands();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-stone-900 mb-2">Nos marques</h1>
      <p className="text-stone-500 mb-8">
        Decouvrez les marques que nous avons selectionnees pour vous.
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-stone-200 p-6 animate-pulse h-40" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <p className="text-stone-500 text-center py-16">Aucune marque pour le moment.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/marques/${brand.slug}`}
              className="group bg-white rounded-xl border border-stone-200 p-6 flex flex-col items-center text-center hover:shadow-lg hover:border-stone-300 transition-all"
            >
              <div className="w-20 h-20 bg-stone-50 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={brand.name}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <span className="text-2xl font-bold text-stone-300">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-semibold text-stone-900 group-hover:text-stone-700">
                {brand.name}
              </h3>
              {brand.description && (
                <p className="text-xs text-stone-500 mt-1 line-clamp-2">{brand.description}</p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
