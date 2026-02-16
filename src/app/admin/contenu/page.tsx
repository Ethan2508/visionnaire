"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Save, Plus, Trash2, Loader2, FileText, Image, Code } from "lucide-react";

interface ContentItem {
  id: string;
  key: string;
  value: string;
  content_type: string;
  updated_at: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  text: <FileText size={14} />,
  image: <Image size={14} />,
  html: <Code size={14} />,
};

export default function ContenuAdminPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("text");
  const [adding, setAdding] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("site_content").select("*").order("key");
    setItems((data as ContentItem[]) || []);
    setLoading(false);
  }

  async function saveItem(item: ContentItem) {
    setSaving(item.id);
    const supabase = createClient();
    const { error } = await supabase.from("site_content").update({
      value: item.value,
      content_type: item.content_type,
      updated_at: new Date().toISOString(),
    } as never).eq("id", item.id);
    if (error) alert("Erreur : " + error.message);
    setSaving(null);
  }

  async function addItem() {
    if (!newKey || !newValue) return;
    setAdding(true);
    const supabase = createClient();
    const { error } = await supabase.from("site_content").insert({
      key: newKey,
      value: newValue,
      content_type: newType,
    } as never);
    if (error) { alert("Erreur : " + error.message); setAdding(false); return; }
    setNewKey("");
    setNewValue("");
    setNewType("text");
    setAdding(false);
    load();
  }

  async function deleteItem(id: string) {
    if (!confirm("Supprimer ce contenu ?")) return;
    const supabase = createClient();
    await supabase.from("site_content").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateItem(id: string, field: string, value: string) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [field]: value } : i)));
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-400" size={32} /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-stone-900 mb-6">Contenu du site</h1>

      {/* Ajouter */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 mb-6">
        <h2 className="text-sm font-semibold text-stone-900 mb-3">Ajouter un contenu</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-stone-500 mb-1">Clé</label>
            <input type="text" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="hero_title" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs text-stone-500 mb-1">Valeur</label>
            <input type="text" value={newValue} onChange={(e) => setNewValue(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Type</label>
            <select value={newType} onChange={(e) => setNewType(e.target.value)} className="px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
              <option value="text">Texte</option>
              <option value="image">Image (URL)</option>
              <option value="html">HTML</option>
            </select>
          </div>
          <button onClick={addItem} disabled={adding || !newKey || !newValue} className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-1.5">
            <Plus size={14} /> Ajouter
          </button>
        </div>
      </div>

      {/* Liste */}
      {items.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          <FileText size={40} className="mx-auto mb-3 opacity-50" />
          <p>Aucun contenu configuré</p>
          <p className="text-xs mt-1">Ajoutez des éléments comme hero_title, hero_subtitle, about_text…</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-stone-200 p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-stone-900">{item.key}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-stone-100 text-stone-500">
                      {TYPE_ICONS[item.content_type]} {item.content_type}
                    </span>
                    <span className="text-xs text-stone-400 ml-auto">
                      Modifié le {new Date(item.updated_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  {item.content_type === "html" ? (
                    <textarea value={item.value} onChange={(e) => updateItem(item.id, "value", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900 min-h-[100px]" />
                  ) : item.content_type === "image" ? (
                    <div className="flex gap-3 items-start">
                      <input type="text" value={item.value} onChange={(e) => updateItem(item.id, "value", e.target.value)} className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="URL de l'image" />
                      {item.value && <img src={item.value} alt="" className="w-16 h-16 object-cover rounded-lg border border-stone-200" />}
                    </div>
                  ) : (
                    <input type="text" value={item.value} onChange={(e) => updateItem(item.id, "value", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                  <button onClick={() => saveItem(item)} disabled={saving === item.id} className="p-2 bg-stone-100 text-stone-700 rounded-lg hover:bg-stone-200 transition-colors disabled:opacity-50">
                    {saving === item.id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-2 text-stone-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
