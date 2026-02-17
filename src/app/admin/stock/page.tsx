"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice, categoryLabel } from "@/lib/utils";
import {
  Package,
  Search,
  Save,
  AlertTriangle,
  Check,
  Minus,
  Plus,
  Filter,
  ArrowUpDown,
  RotateCw,
} from "lucide-react";

interface StockVariant {
  id: string;
  color_name: string;
  color_hex: string | null;
  size: string | null;
  stock_quantity: number;
  is_active: boolean;
  sku: string | null;
  price_override: number | null;
  product: {
    id: string;
    name: string;
    category: string;
    base_price: number;
    is_active: boolean;
    brands: { name: string } | null;
  };
}

type StockFilter = "all" | "low" | "out" | "ok";
type SortBy = "name" | "stock_asc" | "stock_desc" | "brand";

export default function AdminStockPage() {
  const [variants, setVariants] = useState<StockVariant[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [stockFilter, setStockFilter] = useState<StockFilter>("all");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [modified, setModified] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const loadStock = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("product_variants")
      .select(
        "id, color_name, color_hex, size, stock_quantity, is_active, sku, price_override, product:products(id, name, category, base_price, is_active, brands(name))"
      )
      .eq("is_active", true)
      .order("stock_quantity", { ascending: true });

    if (data) {
      // Supabase returns product as object (single join), cast accordingly
      setVariants(
        (data as unknown as StockVariant[]).filter((v) => v.product)
      );
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadStock();
  }, [loadStock]);

  function updateStock(variantId: string, newQty: number) {
    const qty = Math.max(0, newQty);
    setModified((prev) => ({ ...prev, [variantId]: qty }));
    setSavedIds((prev) => {
      const next = new Set(prev);
      next.delete(variantId);
      return next;
    });
  }

  function incrementStock(variantId: string, current: number, delta: number) {
    const currentModified = modified[variantId] ?? current;
    updateStock(variantId, currentModified + delta);
  }

  function getDisplayStock(variant: StockVariant): number {
    return modified[variant.id] ?? variant.stock_quantity;
  }

  async function saveAll() {
    const entries = Object.entries(modified);
    if (entries.length === 0) return;

    setSaving(true);
    const supabase = createClient();
    const newSavedIds = new Set<string>();

    // Batch update all modified variants
    const promises = entries.map(([variantId, qty]) =>
      supabase
        .from("product_variants")
        .update({ stock_quantity: qty } as never)
        .eq("id", variantId)
        .then((result) => {
          if (!result.error) {
            newSavedIds.add(variantId);
          }
          return result;
        })
    );

    await Promise.all(promises);

    // Update local state
    setVariants((prev) =>
      prev.map((v) => {
        if (modified[v.id] !== undefined) {
          return { ...v, stock_quantity: modified[v.id] };
        }
        return v;
      })
    );

    setSavedIds(newSavedIds);
    setModified({});
    setSaving(false);

    // Clear saved indicators after 2s
    setTimeout(() => setSavedIds(new Set()), 2000);
  }

  async function saveSingle(variantId: string) {
    const qty = modified[variantId];
    if (qty === undefined) return;

    const supabase = createClient();
    const { error } = await supabase
      .from("product_variants")
      .update({ stock_quantity: qty } as never)
      .eq("id", variantId);

    if (!error) {
      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock_quantity: qty } : v))
      );
      setModified((prev) => {
        const next = { ...prev };
        delete next[variantId];
        return next;
      });
      setSavedIds((prev) => new Set(prev).add(variantId));
      setTimeout(() => {
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(variantId);
          return next;
        });
      }, 2000);
    }
  }

  // Filtering
  const filtered = variants.filter((v) => {
    // Search
    if (search) {
      const s = search.toLowerCase();
      const matchName = v.product.name.toLowerCase().includes(s);
      const matchBrand = v.product.brands?.name?.toLowerCase().includes(s);
      const matchColor = v.color_name.toLowerCase().includes(s);
      const matchSku = v.sku?.toLowerCase().includes(s);
      if (!matchName && !matchBrand && !matchColor && !matchSku) return false;
    }

    // Category
    if (categoryFilter && v.product.category !== categoryFilter) return false;

    // Stock filter
    const qty = getDisplayStock(v);
    if (stockFilter === "out" && qty !== 0) return false;
    if (stockFilter === "low" && (qty === 0 || qty >= 5)) return false;
    if (stockFilter === "ok" && qty < 5) return false;

    return true;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "stock_asc":
        return getDisplayStock(a) - getDisplayStock(b);
      case "stock_desc":
        return getDisplayStock(b) - getDisplayStock(a);
      case "brand":
        return (a.product.brands?.name || "").localeCompare(
          b.product.brands?.name || ""
        );
      case "name":
      default:
        return a.product.name.localeCompare(b.product.name);
    }
  });

  // Stats
  const totalVariants = variants.length;
  const outOfStock = variants.filter((v) => getDisplayStock(v) === 0).length;
  const lowStock = variants.filter((v) => {
    const q = getDisplayStock(v);
    return q > 0 && q < 5;
  }).length;
  const modifiedCount = Object.keys(modified).length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 flex items-center gap-2">
            <Package size={24} />
            Gestion du stock
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Mettez à jour les quantités rapidement sans modifier chaque produit
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadStock}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm text-stone-600 border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <RotateCw size={16} />
            Rafraîchir
          </button>
          {modifiedCount > 0 && (
            <button
              onClick={saveAll}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              <Save size={16} />
              {saving
                ? "Enregistrement..."
                : `Enregistrer tout (${modifiedCount})`}
            </button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setStockFilter("all")}
          className={`rounded-xl border p-4 text-left transition-colors ${
            stockFilter === "all"
              ? "border-stone-900 bg-stone-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <p className="text-2xl font-bold text-stone-900">{totalVariants}</p>
          <p className="text-xs text-stone-500">Variantes totales</p>
        </button>
        <button
          onClick={() => setStockFilter("ok")}
          className={`rounded-xl border p-4 text-left transition-colors ${
            stockFilter === "ok"
              ? "border-green-600 bg-green-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <p className="text-2xl font-bold text-green-600">
            {totalVariants - outOfStock - lowStock}
          </p>
          <p className="text-xs text-stone-500">En stock (≥ 5)</p>
        </button>
        <button
          onClick={() => setStockFilter("low")}
          className={`rounded-xl border p-4 text-left transition-colors ${
            stockFilter === "low"
              ? "border-amber-600 bg-amber-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <p className="text-2xl font-bold text-amber-600">{lowStock}</p>
          <p className="text-xs text-stone-500">Stock faible (1-4)</p>
        </button>
        <button
          onClick={() => setStockFilter("out")}
          className={`rounded-xl border p-4 text-left transition-colors ${
            stockFilter === "out"
              ? "border-red-600 bg-red-50"
              : "border-stone-200 bg-white hover:border-stone-300"
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{outOfStock}</p>
          <p className="text-xs text-stone-500">Rupture de stock</p>
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom, marque, couleur, SKU..."
            className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
          >
            <option value="">Toutes catégories</option>
            <option value="vue">Lunettes de vue</option>
            <option value="soleil">Lunettes de soleil</option>
            <option value="ski">Masques de ski</option>
            <option value="sport">Sport</option>
            <option value="enfant">Enfant</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
          >
            <option value="name">Tri : Nom A→Z</option>
            <option value="stock_asc">Tri : Stock ↑</option>
            <option value="stock_desc">Tri : Stock ↓</option>
            <option value="brand">Tri : Marque</option>
          </select>
        </div>
      </div>

      {/* Modified count banner */}
      {modifiedCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 flex items-center justify-between">
          <p className="text-sm text-amber-800">
            <strong>{modifiedCount}</strong> modification
            {modifiedCount > 1 ? "s" : ""} non enregistrée
            {modifiedCount > 1 ? "s" : ""}
          </p>
          <button
            onClick={saveAll}
            disabled={saving}
            className="text-sm font-medium text-amber-900 hover:underline"
          >
            Tout enregistrer
          </button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg border border-stone-200 p-4 animate-pulse h-14"
            />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <Package className="mx-auto text-stone-300 mb-3" size={48} />
          <p className="text-stone-500">Aucune variante trouvée.</p>
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
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                    Marque
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                    Variante
                  </th>
                  <th className="text-left text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">
                    SKU
                  </th>
                  <th className="text-right text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                    Prix
                  </th>
                  <th className="text-center text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                    Quantité en stock
                  </th>
                  <th className="text-center text-xs font-semibold text-stone-500 uppercase tracking-wider px-4 py-3 w-20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {sorted.map((variant) => {
                  const displayQty = getDisplayStock(variant);
                  const isModified = modified[variant.id] !== undefined;
                  const isSaved = savedIds.has(variant.id);
                  const stockLevel =
                    displayQty === 0
                      ? "out"
                      : displayQty < 5
                      ? "low"
                      : "ok";

                  return (
                    <tr
                      key={variant.id}
                      className={`transition-colors ${
                        isModified
                          ? "bg-amber-50/50"
                          : isSaved
                          ? "bg-green-50/50"
                          : "hover:bg-stone-50"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-stone-900 line-clamp-1">
                          {variant.product.name}
                        </span>
                        <span className="text-xs text-stone-400 block md:hidden">
                          {variant.product.brands?.name}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-600 hidden md:table-cell">
                        {variant.product.brands?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {variant.color_hex && (
                            <span
                              className="w-4 h-4 rounded-full border border-stone-200 shrink-0"
                              style={{ backgroundColor: variant.color_hex }}
                            />
                          )}
                          <span className="text-sm text-stone-700">
                            {variant.color_name}
                          </span>
                          {variant.size && (
                            <span className="text-xs text-stone-400">
                              — {variant.size}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-stone-400 font-mono hidden lg:table-cell">
                        {variant.sku || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-900 text-right hidden sm:table-cell">
                        {formatPrice(
                          variant.price_override ||
                            variant.product.base_price
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const current = modified[variant.id] ?? variant.stock_quantity;
                              if (current > 0) {
                                incrementStock(variant.id, variant.stock_quantity, -1);
                              }
                            }}
                            disabled={(modified[variant.id] ?? variant.stock_quantity) === 0}
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            min="0"
                            max="9999"
                            value={displayQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              updateStock(variant.id, isNaN(val) ? 0 : Math.max(0, val));
                            }}
                            className={`w-16 text-center px-2 py-1 border rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-stone-900 ${
                              stockLevel === "out"
                                ? "border-red-300 bg-red-50 text-red-700"
                                : stockLevel === "low"
                                ? "border-amber-300 bg-amber-50 text-amber-700"
                                : "border-stone-300 bg-white text-stone-900"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              incrementStock(
                                variant.id,
                                variant.stock_quantity,
                                1
                              )
                            }
                            className="p-1 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded transition-colors"
                          >
                            <Plus size={14} />
                          </button>
                          {stockLevel === "out" && (
                            <AlertTriangle
                              size={14}
                              className="text-red-500 ml-1"
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isModified ? (
                          <button
                            onClick={() => saveSingle(variant.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-stone-900 bg-stone-100 hover:bg-stone-200 px-2 py-1 rounded-lg transition-colors"
                          >
                            <Save size={12} />
                            Sauver
                          </button>
                        ) : isSaved ? (
                          <span className="inline-flex items-center gap-1 text-xs text-green-600">
                            <Check size={14} />
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Bottom save bar */}
          {modifiedCount > 0 && (
            <div className="sticky bottom-0 bg-stone-900 text-white px-4 py-3 flex items-center justify-between">
              <p className="text-sm">
                {modifiedCount} modification{modifiedCount > 1 ? "s" : ""} en
                attente
              </p>
              <button
                onClick={saveAll}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-white text-stone-900 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                <Save size={14} />
                {saving ? "Enregistrement..." : "Tout enregistrer"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
