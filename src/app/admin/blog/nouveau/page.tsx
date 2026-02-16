"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Image as ImageIcon } from "lucide-react";

export default function NewBlogPostPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    cover_image_url: "",
    is_published: false,
    meta_title: "",
    meta_description: "",
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === "title" && !form.slug ? { slug: slugify(value as string) } : {}),
    }));
  }

  async function handleSave(publish?: boolean) {
    if (!form.title || !form.content) { alert("Titre et contenu sont obligatoires."); return; }
    setSaving(true);
    const supabase = createClient();
    const slug = form.slug || slugify(form.title);
    const isPublished = publish ?? form.is_published;

    const { data, error } = await supabase.from("blog_posts").insert({
      title: form.title,
      slug,
      excerpt: form.excerpt || null,
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    } as never).select("id").single();

    if (error) { alert("Erreur : " + error.message); setSaving(false); return; }
    router.push("/admin/blog");
  }

  async function uploadCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const supabase = createClient();
    const ext = file.name.split(".").pop();
    const fileName = `blog-${Date.now()}.${ext}`;
    const { data, error } = await supabase.storage.from("blog-images").upload(fileName, file);
    if (error) { alert("Erreur upload : " + error.message); return; }
    const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(data.path);
    setForm((prev) => ({ ...prev, cover_image_url: urlData.publicUrl }));
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blog" className="p-2 text-stone-400 hover:text-stone-900 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-stone-900">Nouvel article</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
              <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" placeholder="Titre de l'article" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono" placeholder="titre-de-l-article" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Extrait</label>
              <textarea value={form.excerpt} onChange={(e) => updateField("excerpt", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" rows={2} placeholder="Court résumé de l'article..." />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Contenu *</label>
              <textarea value={form.content} onChange={(e) => updateField("content", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 min-h-[400px] font-mono" placeholder="Rédigez votre article en HTML ou texte brut..." />
            </div>
          </div>

          {/* SEO */}
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-stone-900">SEO</h2>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Meta title</label>
              <input type="text" value={form.meta_title} onChange={(e) => updateField("meta_title", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Meta description</label>
              <textarea value={form.meta_description} onChange={(e) => updateField("meta_description", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" rows={2} />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Image de couverture */}
          <div className="bg-white rounded-xl border border-stone-200 p-4">
            <h2 className="text-sm font-semibold text-stone-900 mb-3">Image de couverture</h2>
            {form.cover_image_url ? (
              <div className="relative">
                <img src={form.cover_image_url} alt="" className="w-full aspect-video object-cover rounded-lg" />
                <button onClick={() => setForm((prev) => ({ ...prev, cover_image_url: "" }))} className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50">Suppr.</button>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-2 border-2 border-dashed border-stone-300 rounded-lg p-6 cursor-pointer hover:border-stone-500 transition-colors">
                <ImageIcon size={24} className="text-stone-400" />
                <span className="text-xs text-stone-500">Cliquez pour uploader</span>
                <input type="file" accept="image/*" onChange={uploadCover} className="hidden" />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
            <button onClick={() => handleSave(false)} disabled={saving} className="w-full py-2.5 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={16} /> Enregistrer brouillon
            </button>
            <button onClick={() => handleSave(true)} disabled={saving} className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Eye size={16} /> Publier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
