"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/utils";
import { Save, Upload } from "lucide-react";

interface BrandData {
  name: string;
  slug: string;
  description: string;
  logo_url: string;
  is_active: boolean;
  sort_order: string;
}

export default function BrandForm({ brandId }: { brandId?: string }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [brand, setBrand] = useState<BrandData>({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    is_active: true,
    sort_order: "0",
  });

  useEffect(() => {
    if (brandId) loadBrand();
  }, [brandId]);

  async function loadBrand() {
    const supabase = createClient();
    const { data } = (await supabase
      .from("brands")
      .select("*")
      .eq("id", brandId!)
      .single()) as { data: { name: string; slug: string; description: string | null; logo_url: string | null; is_active: boolean; sort_order: number } | null };
    if (data) {
      setBrand({
        name: data.name,
        slug: data.slug,
        description: data.description || "",
        logo_url: data.logo_url || "",
        is_active: data.is_active,
        sort_order: String(data.sort_order),
      });
    }
  }

  function update(field: keyof BrandData, value: string | boolean) {
    setBrand((prev) => {
      const updated = { ...prev, [field]: value };
      if (field === "name" && !brandId) {
        updated.slug = slugify(value as string);
      }
      return updated;
    });
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    setUploading(true);
    const supabase = createClient();
    const file = e.target.files[0];
    const ext = file.name.split(".").pop();
    const fileName = `brands/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, file);

    if (uploadError) {
      setError(`Erreur upload: ${uploadError.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
    update("logo_url", data.publicUrl);
    setUploading(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!brand.name) {
      setError("Le nom est obligatoire.");
      setSaving(false);
      return;
    }

    const supabase = createClient();
    const payload = {
      name: brand.name,
      slug: brand.slug,
      description: brand.description || null,
      logo_url: brand.logo_url || null,
      is_active: brand.is_active,
      sort_order: parseInt(brand.sort_order) || 0,
    };

    if (brandId) {
      const { error } = await supabase.from("brands").update(payload as never).eq("id", brandId);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("brands").insert(payload as never);
      if (error) {
        setError(error.message);
        setSaving(false);
        return;
      }
    }

    router.push("/admin/marques");
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Nom de la marque *</label>
          <input
            type="text"
            value={brand.name}
            onChange={(e) => update("name", e.target.value)}
            required
            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            placeholder="Ex: Ray-Ban"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Slug</label>
          <input
            type="text"
            value={brand.slug}
            onChange={(e) => update("slug", e.target.value)}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 text-stone-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Description</label>
          <textarea
            value={brand.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 resize-y"
            placeholder="Presentation de la marque..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Logo</label>
          <div className="flex items-center gap-4">
            {brand.logo_url && (
              <div className="w-16 h-16 bg-stone-100 rounded-lg overflow-hidden">
                <img src={brand.logo_url} alt="" className="w-full h-full object-contain p-1" />
              </div>
            )}
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-stone-300 rounded-lg text-sm cursor-pointer hover:bg-stone-50">
              <Upload size={16} />
              {uploading ? "Upload..." : "Choisir un fichier"}
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Ordre d&#39;affichage</label>
          <input
            type="number"
            value={brand.sort_order}
            onChange={(e) => update("sort_order", e.target.value)}
            className="w-24 px-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={brand.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
            className="rounded border-stone-300"
          />
          <span className="text-sm text-stone-700">Marque active (visible sur le site)</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={() => router.push("/admin/marques")}
          className="px-6 py-2.5 text-sm font-medium text-stone-700 hover:text-stone-900"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {brandId ? "Mettre a jour" : "Creer la marque"}
        </button>
      </div>
    </form>
  );
}
