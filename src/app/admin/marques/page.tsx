"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBrands();
  }, []);

  async function loadBrands() {
    const supabase = createClient();
    const { data } = (await supabase
      .from("brands")
      .select("id, name, slug, logo_url, is_active, sort_order")
      .order("sort_order")
      .order("name")) as { data: BrandRow[] | null };
    setBrands(data || []);
    setLoading(false);
  }

  async function toggleActive(id: string, current: boolean) {
    const supabase = createClient();
    await supabase.from("brands").update({ is_active: !current } as never).eq("id", id);
    setBrands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, is_active: !current } : b))
    );
  }

  async function deleteBrand(id: string, name: string) {
    if (!confirm(`Supprimer la marque "${name}" ?`)) return;
    const supabase = createClient();
    await supabase.from("brands").delete().eq("id", id);
    setBrands((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Marques</h1>
        <Link
          href="/admin/marques/nouveau"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus size={18} />
          Ajouter une marque
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-stone-200 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <p className="text-stone-500">Aucune marque enregistree.</p>
          <Link
            href="/admin/marques/nouveau"
            className="inline-flex items-center gap-2 text-stone-900 font-medium mt-2 hover:underline"
          >
            <Plus size={16} /> Ajouter votre premiere marque
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="bg-white rounded-xl border border-stone-200 p-4 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-stone-100 rounded-lg shrink-0 flex items-center justify-center overflow-hidden">
                {brand.logo_url ? (
                  <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-1" />
                ) : (
                  <span className="text-stone-400 text-lg font-bold">
                    {brand.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-stone-900 truncate">
                  {brand.name}
                </h3>
                <button
                  onClick={() => toggleActive(brand.id, brand.is_active)}
                  className={`inline-flex items-center gap-1 text-xs mt-1 ${
                    brand.is_active ? "text-green-600" : "text-stone-400"
                  }`}
                >
                  {brand.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {brand.is_active ? "Active" : "Masquee"}
                </button>
              </div>
              <div className="flex items-center gap-1">
                <Link
                  href={`/admin/marques/${brand.id}`}
                  className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                >
                  <Pencil size={16} />
                </Link>
                <button
                  onClick={() => deleteBrand(brand.id, brand.name)}
                  className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
