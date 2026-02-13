"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Plus, Search, Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { formatPrice, categoryLabel } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  base_price: number;
  is_active: boolean;
  is_featured: boolean;
  brands: { name: string } | null;
  product_images: { url: string }[];
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    const supabase = createClient();
    const { data } = (await supabase
      .from("products")
      .select("id, name, slug, category, base_price, is_active, is_featured, brands(name), product_images(url)")
      .order("created_at", { ascending: false })) as { data: ProductRow[] | null };

    setProducts(data || []);
    setLoading(false);
  }

  async function toggleActive(id: string, currentState: boolean) {
    const supabase = createClient();
    await supabase.from("products").update({ is_active: !currentState } as never).eq("id", id);
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: !currentState } : p))
    );
  }

  async function deleteProduct(id: string, name: string) {
    if (!confirm(`Supprimer "${name}" ? Cette action est irreversible.`)) return;
    const supabase = createClient();
    await supabase.from("products").delete().eq("id", id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brands?.name?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = !categoryFilter || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Produits</h1>
        <Link
          href="/admin/produits/nouveau"
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus size={18} />
          Ajouter un produit
        </Link>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un produit ou une marque..."
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
        >
          <option value="">Toutes les categories</option>
          <option value="vue">Lunettes de vue</option>
          <option value="soleil">Lunettes de soleil</option>
          <option value="ski">Masques de ski</option>
          <option value="sport">Sport</option>
          <option value="enfant">Enfant</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-stone-200 p-4 animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <p className="text-stone-500">Aucun produit trouve.</p>
          <Link
            href="/admin/produits/nouveau"
            className="inline-flex items-center gap-2 text-stone-900 font-medium mt-2 hover:underline"
          >
            <Plus size={16} />
            Ajouter votre premier produit
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50">
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                    Produit
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Categorie
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Marque
                  </th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                    Prix
                  </th>
                  <th className="text-center text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                    Statut
                  </th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-stone-100 rounded-lg shrink-0 overflow-hidden">
                          {product.product_images?.[0]?.url ? (
                            <img
                              src={product.product_images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400 text-xs">
                              —
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium text-stone-900 truncate max-w-[200px]">
                          {product.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-xs bg-stone-100 text-stone-600 px-2 py-1 rounded-full">
                        {categoryLabel(product.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-600 hidden md:table-cell">
                      {product.brands?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-stone-900 font-medium text-right">
                      {formatPrice(product.base_price)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleActive(product.id, product.is_active)}
                        className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                          product.is_active
                            ? "bg-green-50 text-green-700"
                            : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        {product.is_active ? (
                          <>
                            <Eye size={12} /> Actif
                          </>
                        ) : (
                          <>
                            <EyeOff size={12} /> Masque
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/produits/${product.id}`}
                          className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                          title="Modifier"
                        >
                          <Pencil size={16} />
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id, product.name)}
                          className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
