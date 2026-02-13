"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProductCard from "@/components/catalogue/ProductCard";
import { SlidersHorizontal, X } from "lucide-react";
import { categoryLabel } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  gender: string;
  base_price: number;
  requires_prescription: boolean;
  frame_shape: string | null;
  brands: { name: string } | null;
  product_images: { url: string; is_primary: boolean }[];
}

interface Brand {
  id: string;
  name: string;
}

function CataloguePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filtres actifs depuis l'URL
  const categoryFilter = searchParams.get("categorie") || "";
  const brandFilter = searchParams.get("marque") || "";
  const genderFilter = searchParams.get("genre") || "";
  const searchQuery = searchParams.get("q") || "";
  const sortBy = searchParams.get("tri") || "recent";

  useEffect(() => {
    loadData();
  }, [categoryFilter, brandFilter, genderFilter, searchQuery, sortBy]);

  async function loadData() {
    setLoading(true);
    const supabase = createClient();

    // Charger marques
    const { data: brandsData } = (await supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name")) as { data: Brand[] | null };
    setBrands(brandsData || []);

    // Construire la requete produits
    let query = supabase
      .from("products")
      .select("id, name, slug, category, gender, base_price, requires_prescription, frame_shape, brands(name), product_images(url, is_primary)")
      .eq("is_active", true);

    if (categoryFilter) {
      query = query.eq("category", categoryFilter);
    }
    if (brandFilter) {
      query = query.eq("brand_id", brandFilter);
    }
    if (genderFilter) {
      query = query.eq("gender", genderFilter);
    }
    if (searchQuery) {
      query = query.ilike("name", `%${searchQuery}%`);
    }

    // Tri
    if (sortBy === "prix-asc") {
      query = query.order("base_price", { ascending: true });
    } else if (sortBy === "prix-desc") {
      query = query.order("base_price", { ascending: false });
    } else if (sortBy === "nom") {
      query = query.order("name");
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data } = (await query) as { data: Product[] | null };
    setProducts(data || []);
    setLoading(false);
  }

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/catalogue?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/catalogue");
  }

  const hasActiveFilters = categoryFilter || brandFilter || genderFilter || searchQuery;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Titre */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">
          {categoryFilter ? categoryLabel(categoryFilter) : "Notre catalogue"}
        </h1>
        {searchQuery && (
          <p className="text-stone-500 mt-1">
            Resultats pour &quot;{searchQuery}&quot;
          </p>
        )}
        <p className="text-stone-500 mt-1">{products.length} produit{products.length > 1 ? "s" : ""}</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filtres desktop */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24 space-y-6">
            <FilterSection
              title="Categorie"
              value={categoryFilter}
              onChange={(v) => setFilter("categorie", v)}
              options={[
                { value: "", label: "Toutes" },
                { value: "vue", label: "Lunettes de vue" },
                { value: "soleil", label: "Lunettes de soleil" },
                { value: "ski", label: "Masques de ski" },
                { value: "sport", label: "Sport" },
                { value: "enfant", label: "Enfant" },
              ]}
            />

            <FilterSection
              title="Genre"
              value={genderFilter}
              onChange={(v) => setFilter("genre", v)}
              options={[
                { value: "", label: "Tous" },
                { value: "homme", label: "Homme" },
                { value: "femme", label: "Femme" },
                { value: "mixte", label: "Mixte" },
              ]}
            />

            {brands.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-2">Marque</h3>
                <select
                  value={brandFilter}
                  onChange={(e) => setFilter("marque", e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="">Toutes les marques</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900"
              >
                <X size={14} />
                Effacer les filtres
              </button>
            )}
          </div>
        </aside>

        {/* Mobile filter toggle */}
        <div className="lg:hidden flex items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm font-medium text-stone-700"
          >
            <SlidersHorizontal size={16} />
            Filtres
          </button>
          <select
            value={sortBy}
            onChange={(e) => setFilter("tri", e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
          >
            <option value="recent">Plus recents</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix decroissant</option>
            <option value="nom">Nom A-Z</option>
          </select>
        </div>

        {/* Mobile filters */}
        {showFilters && (
          <div className="lg:hidden bg-white rounded-xl border border-stone-200 p-4 space-y-4 mb-4">
            <FilterSection
              title="Categorie"
              value={categoryFilter}
              onChange={(v) => setFilter("categorie", v)}
              options={[
                { value: "", label: "Toutes" },
                { value: "vue", label: "Lunettes de vue" },
                { value: "soleil", label: "Lunettes de soleil" },
                { value: "ski", label: "Masques de ski" },
                { value: "sport", label: "Sport" },
                { value: "enfant", label: "Enfant" },
              ]}
            />
            <FilterSection
              title="Genre"
              value={genderFilter}
              onChange={(v) => setFilter("genre", v)}
              options={[
                { value: "", label: "Tous" },
                { value: "homme", label: "Homme" },
                { value: "femme", label: "Femme" },
                { value: "mixte", label: "Mixte" },
              ]}
            />
          </div>
        )}

        {/* Grille produits */}
        <div className="flex-1">
          {/* Tri desktop */}
          <div className="hidden lg:flex items-center justify-end mb-4">
            <select
              value={sortBy}
              onChange={(e) => setFilter("tri", e.target.value)}
              className="px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-stone-900"
            >
              <option value="recent">Plus recents</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix decroissant</option>
              <option value="nom">Nom A-Z</option>
            </select>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl border border-stone-200 animate-pulse">
                  <div className="aspect-square bg-stone-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                    <div className="h-4 bg-stone-100 rounded w-2/3" />
                    <div className="h-4 bg-stone-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-stone-500">Aucun produit ne correspond a vos criteres.</p>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-stone-900 font-medium mt-2 hover:underline"
                >
                  Voir tous les produits
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => {
                const primaryImage = product.product_images?.find((img) => img.is_primary)
                  || product.product_images?.[0];
                return (
                  <ProductCard
                    key={product.id}
                    slug={product.slug}
                    name={product.name}
                    brandName={product.brands?.name}
                    price={product.base_price}
                    imageUrl={primaryImage?.url}
                    category={product.category}
                    requiresPrescription={product.requires_prescription}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSection({
  title,
  value,
  onChange,
  options,
}: {
  title: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-stone-900 mb-2">{title}</h3>
      <div className="space-y-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
              value === opt.value
                ? "bg-stone-900 text-white"
                : "text-stone-600 hover:bg-stone-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CataloguePageWrapper() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-8 animate-pulse"><div className="h-8 bg-stone-200 rounded w-48 mb-8" /></div>}>
      <CataloguePage />
    </Suspense>
  );
}
