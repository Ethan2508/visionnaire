"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { Save, Plus, Trash2, Upload, X } from "lucide-react";
import type { ProductCategory, ProductGender } from "@/types/database";

interface Brand {
  id: string;
  name: string;
}

interface Variant {
  id?: string;
  color_name: string;
  color_hex: string;
  size: string;
  price_override: string;
  stock_quantity: string;
  is_active: boolean;
}

interface ProductImage {
  id?: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
  variant_id?: string | null;
}

interface ProductData {
  id?: string;
  name: string;
  slug: string;
  description: string;
  category: ProductCategory;
  gender: ProductGender;
  brand_id: string;
  base_price: string;
  is_active: boolean;
  is_featured: boolean;
  requires_prescription: boolean;
  frame_shape: string;
  frame_material: string;
  frame_color: string;
  meta_title: string;
  meta_description: string;
}

const emptyVariant: Variant = {
  color_name: "",
  color_hex: "#000000",
  size: "",
  price_override: "",
  stock_quantity: "0",
  is_active: true,
};

export default function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [uploading, setUploading] = useState(false);

  const [product, setProduct] = useState<ProductData>({
    name: "",
    slug: "",
    description: "",
    category: "vue",
    gender: "mixte",
    brand_id: "",
    base_price: "",
    is_active: true,
    is_featured: false,
    requires_prescription: false,
    frame_shape: "",
    frame_material: "",
    frame_color: "",
    meta_title: "",
    meta_description: "",
  });

  const [variants, setVariants] = useState<Variant[]>([{ ...emptyVariant }]);

  useEffect(() => {
    loadBrands();
    if (productId) loadProduct();
  }, [productId]);

  async function loadBrands() {
    const supabase = createClient();
    const { data } = (await supabase
      .from("brands")
      .select("id, name")
      .eq("is_active", true)
      .order("name")) as { data: Brand[] | null };
    setBrands(data || []);
  }

  async function loadProduct() {
    if (!productId) return;
    const supabase = createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: p } = (await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single()) as { data: any };

    if (p) {
      setProduct({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description || "",
        category: p.category,
        gender: p.gender,
        brand_id: p.brand_id || "",
        base_price: String(p.base_price),
        is_active: p.is_active,
        is_featured: p.is_featured,
        requires_prescription: p.requires_prescription,
        frame_shape: p.frame_shape || "",
        frame_material: p.frame_material || "",
        frame_color: p.frame_color || "",
        meta_title: p.meta_title || "",
        meta_description: p.meta_description || "",
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: v } = (await supabase
      .from("product_variants")
      .select("*")
      .eq("product_id", productId)
      .order("created_at")) as { data: any[] | null };

    if (v && v.length > 0) {
      setVariants(
        v.map((variant) => ({
          id: variant.id,
          color_name: variant.color_name,
          color_hex: variant.color_hex || "#000000",
          size: variant.size || "",
          price_override: variant.price_override ? String(variant.price_override) : "",
          stock_quantity: String(variant.stock_quantity),
          is_active: variant.is_active,
        }))
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: imgs } = (await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", productId)
      .order("sort_order")) as { data: any[] | null };

    if (imgs) {
      setImages(
        imgs.map((img) => ({
          id: img.id,
          url: img.url,
          alt_text: img.alt_text || "",
          is_primary: img.is_primary,
          sort_order: img.sort_order,
          variant_id: img.variant_id,
        }))
      );
    }
  }

  function updateProduct(field: keyof ProductData, value: string | boolean) {
    setProduct((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !productId) {
        updated.slug = slugify(value as string);
      }
      if (field === "category") {
        updated.requires_prescription = value === "vue";
      }
      return updated;
    });
  }

  function updateVariant(index: number, field: keyof Variant, value: string | boolean) {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  }

  function addVariant() {
    setVariants((prev) => [...prev, { ...emptyVariant }]);
  }

  function removeVariant(index: number) {
    if (variants.length <= 1) return;
    setVariants((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(e.target.files)) {
      const ext = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        setError(`Erreur upload: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from("images").getPublicUrl(filePath);

      setImages((prev) => [
        ...prev,
        {
          url: urlData.publicUrl,
          alt_text: product.name,
          is_primary: prev.length === 0,
          sort_order: prev.length,
        },
      ]);
    }

    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      if (updated.length > 0 && !updated.some((img) => img.is_primary)) {
        updated[0].is_primary = true;
      }
      return updated;
    });
  }

  function setImagePrimary(index: number) {
    setImages((prev) =>
      prev.map((img, i) => ({ ...img, is_primary: i === index }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!product.name || !product.base_price || !product.slug) {
      setError("Veuillez remplir les champs obligatoires (nom, prix).");
      setSaving(false);
      return;
    }

    const supabase = createClient();

    const productPayload = {
      name: product.name,
      slug: product.slug,
      description: product.description || null,
      category: product.category,
      gender: product.gender,
      brand_id: product.brand_id || null,
      base_price: parseFloat(product.base_price),
      is_active: product.is_active,
      is_featured: product.is_featured,
      requires_prescription: product.requires_prescription,
      frame_shape: product.frame_shape || null,
      frame_material: product.frame_material || null,
      frame_color: product.frame_color || null,
      meta_title: product.meta_title || null,
      meta_description: product.meta_description || null,
    };

    let currentProductId = productId;

    if (productId) {
      const { error } = await supabase
        .from("products")
        .update(productPayload as never)
        .eq("id", productId);
      if (error) {
        setError(`Erreur: ${error.message}`);
        setSaving(false);
        return;
      }
    } else {
      const { data, error } = (await supabase
        .from("products")
        .insert(productPayload as never)
        .select("id")
        .single()) as { data: { id: string } | null; error: { message: string } | null };
      if (error) {
        setError(`Erreur: ${error.message}`);
        setSaving(false);
        return;
      }
      currentProductId = data!.id;
    }

    // Sauvegarder les variantes
    if (productId) {
      await supabase.from("product_variants").delete().eq("product_id", productId);
    }

    const validVariants = variants.filter((v) => v.color_name.trim());
    if (validVariants.length > 0) {
      const { error: varError } = await supabase.from("product_variants").insert(
        validVariants.map((v) => ({
          product_id: currentProductId!,
          color_name: v.color_name,
          color_hex: v.color_hex,
          size: v.size || null,
          price_override: v.price_override ? parseFloat(v.price_override) : null,
          stock_quantity: parseInt(v.stock_quantity) || 0,
          is_active: v.is_active,
        })) as never
      );
      if (varError) {
        setError(`Erreur variantes: ${varError.message}`);
        setSaving(false);
        return;
      }
    }

    // Sauvegarder les images
    if (productId) {
      await supabase.from("product_images").delete().eq("product_id", productId);
    }

    if (images.length > 0) {
      await supabase.from("product_images").insert(
        images.map((img, i) => ({
          product_id: currentProductId!,
          url: img.url,
          alt_text: img.alt_text || product.name,
          is_primary: img.is_primary,
          sort_order: i,
        })) as never
      );
    }

    setSaving(false);
    router.push("/admin/produits");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {/* Informations principales */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Informations generales
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Nom du produit *
            </label>
            <input
              type="text"
              value={product.name}
              onChange={(e) => updateProduct("name", e.target.value)}
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="Ex: Ray-Ban Aviator Classic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Slug (URL)
            </label>
            <input
              type="text"
              value={product.slug}
              onChange={(e) => updateProduct("slug", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Prix de base (EUR) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={product.base_price}
              onChange={(e) => updateProduct("base_price", e.target.value)}
              required
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="149.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Categorie *
            </label>
            <select
              value={product.category}
              onChange={(e) => updateProduct("category", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              <option value="vue">Lunettes de vue</option>
              <option value="soleil">Lunettes de soleil</option>
              <option value="ski">Masques de ski</option>
              <option value="sport">Sport</option>
              <option value="enfant">Enfant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Genre
            </label>
            <select
              value={product.gender}
              onChange={(e) => updateProduct("gender", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              <option value="mixte">Mixte</option>
              <option value="homme">Homme</option>
              <option value="femme">Femme</option>
              <option value="enfant">Enfant</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Marque
            </label>
            <select
              value={product.brand_id}
              onChange={(e) => updateProduct("brand_id", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
            >
              <option value="">— Aucune marque —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description
            </label>
            <textarea
              value={product.description}
              onChange={(e) => updateProduct("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 resize-y"
              placeholder="Decrivez le produit..."
            />
          </div>
        </div>
      </div>

      {/* Caractéristiques */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">
          Caracteristiques
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Forme
            </label>
            <input
              type="text"
              value={product.frame_shape}
              onChange={(e) => updateProduct("frame_shape", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="Aviateur, Rond, Carre..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Materiau
            </label>
            <input
              type="text"
              value={product.frame_material}
              onChange={(e) => updateProduct("frame_material", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="Metal, Acetate, Titane..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Couleur principale
            </label>
            <input
              type="text"
              value={product.frame_color}
              onChange={(e) => updateProduct("frame_color", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="Noir, Dore, Ecaille..."
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-6 mt-4 pt-4 border-t border-stone-100">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={product.is_active}
              onChange={(e) => updateProduct("is_active", e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-700">Produit actif (visible sur le site)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={product.is_featured}
              onChange={(e) => updateProduct("is_featured", e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-700">Mettre en avant</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={product.requires_prescription}
              onChange={(e) => updateProduct("requires_prescription", e.target.checked)}
              className="rounded border-stone-300"
            />
            <span className="text-sm text-stone-700">Necessite une ordonnance</span>
          </label>
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">Images</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
          {images.map((img, index) => (
            <div
              key={index}
              className={`relative group rounded-lg border-2 overflow-hidden aspect-square ${
                img.is_primary ? "border-stone-900" : "border-stone-200"
              }`}
            >
              <img src={img.url} alt={img.alt_text} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => setImagePrimary(index)}
                    className="bg-white text-stone-900 text-xs px-2 py-1 rounded font-medium"
                  >
                    Principale
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="bg-red-600 text-white p-1.5 rounded"
                >
                  <X size={14} />
                </button>
              </div>
              {img.is_primary && (
                <span className="absolute top-1 left-1 bg-stone-900 text-white text-[10px] px-1.5 py-0.5 rounded">
                  Principale
                </span>
              )}
            </div>
          ))}

          <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-300 rounded-lg aspect-square cursor-pointer hover:border-stone-400 hover:bg-stone-50 transition-colors">
            <Upload size={24} className="text-stone-400 mb-1" />
            <span className="text-xs text-stone-500">
              {uploading ? "Upload..." : "Ajouter"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>
      </div>

      {/* Variantes */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-stone-900">Variantes</h2>
          <button
            type="button"
            onClick={addVariant}
            className="inline-flex items-center gap-1 text-sm font-medium text-stone-900 hover:text-stone-700"
          >
            <Plus size={16} /> Ajouter
          </button>
        </div>

        <div className="space-y-4">
          {variants.map((variant, index) => (
            <div
              key={index}
              className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end p-4 bg-stone-50 rounded-lg"
            >
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Couleur *
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={variant.color_hex}
                    onChange={(e) => updateVariant(index, "color_hex", e.target.value)}
                    className="w-8 h-8 rounded border border-stone-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={variant.color_name}
                    onChange={(e) => updateVariant(index, "color_name", e.target.value)}
                    placeholder="Nom couleur"
                    className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Taille
                </label>
                <input
                  type="text"
                  value={variant.size}
                  onChange={(e) => updateVariant(index, "size", e.target.value)}
                  placeholder="S, M, L..."
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Prix réduit
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={variant.price_override}
                  onChange={(e) => updateVariant(index, "price_override", e.target.value)}
                  placeholder={product.base_price ? `${product.base_price} €` : "—"}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
                {variant.price_override && product.base_price && parseFloat(variant.price_override) < parseFloat(product.base_price) && (
                  <p className="text-[10px] text-red-600 mt-0.5">
                    -{Math.round((1 - parseFloat(variant.price_override) / parseFloat(product.base_price)) * 100)}% — <span className="line-through">{product.base_price} €</span>
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  min="0"
                  value={variant.stock_quantity}
                  onChange={(e) => updateVariant(index, "stock_quantity", e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={variant.is_active}
                    onChange={(e) => updateVariant(index, "is_active", e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  <span className="text-xs text-stone-600">Actif</span>
                </label>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-stone-200 p-6">
        <h2 className="text-lg font-semibold text-stone-900 mb-4">SEO</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Titre SEO
            </label>
            <input
              type="text"
              value={product.meta_title}
              onChange={(e) => updateProduct("meta_title", e.target.value)}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              placeholder="Laissez vide pour utiliser le nom du produit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Description SEO
            </label>
            <textarea
              value={product.meta_description}
              onChange={(e) => updateProduct("meta_description", e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 resize-y"
              placeholder="Description pour les moteurs de recherche"
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/produits")}
          className="px-6 py-2.5 text-sm font-medium text-stone-700 hover:text-stone-900 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {productId ? "Mettre a jour" : "Creer le produit"}
        </button>
      </div>
    </form>
  );
}
