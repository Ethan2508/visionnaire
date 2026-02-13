"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface LensOption {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  price: number;
  is_active: boolean;
  sort_order: number;
}

const categoryLabels: Record<string, string> = {
  type: "Type de verre",
  traitement: "Traitement",
  amincissement: "Amincissement",
};

const categoryColors: Record<string, string> = {
  type: "bg-blue-50 text-blue-700",
  traitement: "bg-purple-50 text-purple-700",
  amincissement: "bg-amber-50 text-amber-700",
};

export default function AdminLensOptionsPage() {
  const [options, setOptions] = useState<LensOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    category: "type",
    price: "",
    is_active: true,
    sort_order: "0",
  });

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    const supabase = createClient();
    const { data } = (await supabase
      .from("lens_options")
      .select("*")
      .order("category")
      .order("sort_order")
      .order("name")) as { data: LensOption[] | null };
    setOptions(data || []);
    setLoading(false);
  }

  function startEdit(option: LensOption) {
    setEditingId(option.id);
    setShowNew(false);
    setForm({
      name: option.name,
      slug: option.slug,
      description: option.description || "",
      category: option.category,
      price: String(option.price),
      is_active: option.is_active,
      sort_order: String(option.sort_order),
    });
  }

  function startNew() {
    setEditingId(null);
    setShowNew(true);
    setForm({
      name: "",
      slug: "",
      description: "",
      category: "type",
      price: "",
      is_active: true,
      sort_order: "0",
    });
  }

  function cancel() {
    setEditingId(null);
    setShowNew(false);
  }

  async function handleSave() {
    const supabase = createClient();
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const payload = {
      name: form.name,
      slug,
      description: form.description || null,
      category: form.category,
      price: parseFloat(form.price) || 0,
      is_active: form.is_active,
      sort_order: parseInt(form.sort_order) || 0,
    };

    if (editingId) {
      await supabase.from("lens_options").update(payload as never).eq("id", editingId);
    } else {
      await supabase.from("lens_options").insert(payload as never);
    }

    cancel();
    loadOptions();
  }

  async function deleteOption(id: string, name: string) {
    if (!confirm(`Supprimer l'option "${name}" ?`)) return;
    const supabase = createClient();
    await supabase.from("lens_options").delete().eq("id", id);
    setOptions((prev) => prev.filter((o) => o.id !== id));
  }

  const grouped = options.reduce(
    (acc, opt) => {
      if (!acc[opt.category]) acc[opt.category] = [];
      acc[opt.category].push(opt);
      return acc;
    },
    {} as Record<string, LensOption[]>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Options de verres</h1>
        <button
          onClick={startNew}
          className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus size={18} />
          Ajouter
        </button>
      </div>

      {/* Formulaire inline */}
      {(showNew || editingId) && (
        <div className="bg-white rounded-xl border border-stone-200 p-6 mb-6">
          <h3 className="text-sm font-semibold text-stone-900 mb-4">
            {editingId ? "Modifier l'option" : "Nouvelle option"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                placeholder="Ex: Anti-reflet"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Categorie *</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
              >
                <option value="type">Type de verre</option>
                <option value="traitement">Traitement</option>
                <option value="amincissement">Amincissement</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Prix (EUR)</label>
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                placeholder="0.00"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                placeholder="Description courte"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Ordre</label>
              <input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800"
            >
              <Save size={16} />
              Enregistrer
            </button>
            <button onClick={cancel} className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900">
              <X size={16} />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste groupée par catégorie */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-stone-200 p-4 animate-pulse h-20" />
          ))}
        </div>
      ) : options.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <p className="text-stone-500">Aucune option de verre configuree.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([category, opts]) => (
            <div key={category}>
              <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
                {categoryLabels[category] || category}
              </h2>
              <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
                {opts.map((opt) => (
                  <div key={opt.id} className="flex items-center gap-4 px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[opt.category] || "bg-stone-100 text-stone-600"}`}>
                      {categoryLabels[opt.category]}
                    </span>
                    <div className="flex-1">
                      <span className="text-sm font-medium text-stone-900">{opt.name}</span>
                      {opt.description && (
                        <span className="text-xs text-stone-500 ml-2">{opt.description}</span>
                      )}
                    </div>
                    <span className="text-sm font-medium text-stone-700">{formatPrice(opt.price)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(opt)}
                        className="p-1.5 text-stone-400 hover:text-stone-900 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => deleteOption(opt.id, opt.name)}
                        className="p-1.5 text-stone-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
