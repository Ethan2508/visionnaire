"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatPrice } from "@/lib/utils";
import { Ticket, Plus, Pencil, Trash2, Check, X, Copy } from "lucide-react";

interface Promotion {
  id: string;
  name: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  code: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  min_order_amount: number | null;
  created_at: string;
}

const EMPTY: Omit<Promotion, "id" | "created_at"> = {
  name: "",
  description: "",
  discount_type: "percentage",
  discount_value: 0,
  code: "",
  is_active: true,
  starts_at: null,
  ends_at: null,
  min_order_amount: null,
};

export default function AdminPromotionsPage() {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Promotion> | null>(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { loadPromos(); }, []);

  async function loadPromos() {
    const supabase = createClient();
    const { data } = await supabase.from("promotions").select("*").order("created_at", { ascending: false });
    setPromos((data as unknown as Promotion[]) || []);
    setLoading(false);
  }

  async function savePromo() {
    if (!editing || !editing.name || !editing.discount_value) return;
    setSaving(true);
    const supabase = createClient();

    const payload = {
      name: editing.name,
      description: editing.description || null,
      discount_type: editing.discount_type,
      discount_value: editing.discount_value,
      code: editing.code?.toUpperCase().trim() || null,
      is_active: editing.is_active ?? true,
      starts_at: editing.starts_at || null,
      ends_at: editing.ends_at || null,
      min_order_amount: editing.min_order_amount || null,
    };

    if (editing.id) {
      await supabase.from("promotions").update(payload as never).eq("id", editing.id);
    } else {
      await supabase.from("promotions").insert(payload as never);
    }

    setEditing(null);
    setSaving(false);
    await loadPromos();
  }

  async function deletePromo(id: string) {
    if (!confirm("Supprimer ce code promo ?")) return;
    const supabase = createClient();
    await supabase.from("promotions").delete().eq("id", id);
    await loadPromos();
  }

  async function toggleActive(id: string, active: boolean) {
    const supabase = createClient();
    await supabase.from("promotions").update({ is_active: !active } as never).eq("id", id);
    await loadPromos();
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  function isExpired(promo: Promotion) {
    return promo.ends_at && new Date(promo.ends_at) < new Date();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Codes promo</h1>
          <p className="text-sm text-stone-500 mt-1">{promos.length} promotion{promos.length > 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setEditing({ ...EMPTY })} className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
          <Plus size={16} />Nouveau code
        </button>
      </div>

      {/* Modal d'édition */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-stone-900 mb-4">{editing.id ? "Modifier" : "Nouveau"} code promo</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Nom *</label>
                <input type="text" value={editing.name || ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="Ex: Soldes été 2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Code promo</label>
                <input type="text" value={editing.code || ""} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="Ex: ETE2026" />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Description</label>
                <textarea value={editing.description || ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Type de réduction *</label>
                  <select value={editing.discount_type || "percentage"} onChange={(e) => setEditing({ ...editing, discount_type: e.target.value })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
                    <option value="percentage">Pourcentage (%)</option>
                    <option value="fixed">Montant fixe (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Valeur *</label>
                  <input type="number" step="0.01" min="0" value={editing.discount_value || ""} onChange={(e) => setEditing({ ...editing, discount_value: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder={editing.discount_type === "percentage" ? "10" : "25.00"} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Montant minimum de commande</label>
                <input type="number" step="0.01" min="0" value={editing.min_order_amount || ""} onChange={(e) => setEditing({ ...editing, min_order_amount: parseFloat(e.target.value) || null })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="Optionnel" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Début</label>
                  <input type="datetime-local" value={editing.starts_at ? new Date(editing.starts_at).toISOString().slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-stone-600 mb-1">Fin</label>
                  <input type="datetime-local" value={editing.ends_at ? new Date(editing.ends_at).toISOString().slice(0, 16) : ""} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.is_active ?? true} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="rounded border-stone-300" />
                <span className="text-sm text-stone-700">Actif</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors">Annuler</button>
              <button onClick={savePromo} disabled={saving || !editing.name || !editing.discount_value} className="flex-1 bg-stone-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50">{saving ? "Enregistrement..." : "Enregistrer"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-stone-100 rounded-lg animate-pulse" />)}</div>
      ) : promos.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <Ticket size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500 mb-1">Aucun code promo</p>
          <p className="text-xs text-stone-400">Créez votre premier code promo pour offrir des réductions à vos clients.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
          {promos.map((promo) => (
            <div key={promo.id} className="flex items-center gap-4 px-4 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900">{promo.name}</span>
                  {!promo.is_active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-500 font-medium">Inactif</span>}
                  {isExpired(promo) && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600 font-medium">Expiré</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-stone-500">
                  {promo.code && (
                    <button onClick={() => copyCode(promo.code!)} className="inline-flex items-center gap-1 font-mono bg-stone-100 px-2 py-0.5 rounded hover:bg-stone-200 transition-colors">
                      {promo.code}
                      {copied === promo.code ? <Check size={10} className="text-green-600" /> : <Copy size={10} />}
                    </button>
                  )}
                  <span className="font-medium text-stone-700">
                    {promo.discount_type === "percentage" ? `-${promo.discount_value}%` : `-${formatPrice(promo.discount_value)}`}
                  </span>
                  {promo.min_order_amount && <span>Min. {formatPrice(promo.min_order_amount)}</span>}
                  {promo.starts_at && <span>Du {new Date(promo.starts_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}
                  {promo.ends_at && <span>au {new Date(promo.ends_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>}
                </div>
              </div>
              <button onClick={() => toggleActive(promo.id, promo.is_active)} className={`p-2 rounded-lg transition-colors ${promo.is_active ? "text-green-600 hover:bg-green-50" : "text-stone-400 hover:bg-stone-50"}`}>
                {promo.is_active ? <Check size={16} /> : <X size={16} />}
              </button>
              <button onClick={() => setEditing(promo)} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors">
                <Pencil size={16} />
              </button>
              <button onClick={() => deletePromo(promo.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
