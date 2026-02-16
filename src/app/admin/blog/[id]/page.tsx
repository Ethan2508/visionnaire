"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { ArrowLeft, Save, Eye, EyeOff, Image as ImageIcon, Loader2 } from "lucide-react";

export default function EditBlogPostPage() {
  const router = useRouter();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await supabase.from("blog_posts").select("*").eq("id", id as string).single() as { data: any };
      if (data) {
        setForm({
          title: data.title || "",
          slug: data.slug || "",
          excerpt: data.excerpt || "",
          content: data.content || "",
          cover_image_url: data.cover_image_url || "",
          is_published: data.is_published || false,
          meta_title: data.meta_title || "",
          meta_description: data.meta_description || "",
        });
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(togglePublish?: boolean) {
    if (!form.title || !form.content) { alert("Titre et contenu sont obligatoires."); return; }
    setSaving(true);
    const supabase = createClient();
    const isPublished = togglePublish !== undefined ? togglePublish : form.is_published;

    const { error } = await supabase.from("blog_posts").update({
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt || null,
      content: form.content,
      cover_image_url: form.cover_image_url || null,
      is_published: isPublished,
      published_at: isPublished && !form.is_published ? new Date().toISOString() : undefined,
      meta_title: form.meta_title || null,
      meta_description: form.meta_description || null,
    } as never).eq("id", id as string);

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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-stone-400" size={32} /></div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/blog" className="p-2 text-stone-400 hover:text-stone-900 transition-colors"><ArrowLeft size={20} /></Link>
        <h1 className="text-2xl font-bold text-stone-900">Modifier l&apos;article</h1>
        <span className={`ml-auto px-2.5 py-0.5 rounded-full text-xs font-medium ${form.is_published ? "bg-green-100 text-green-800" : "bg-stone-100 text-stone-600"}`}>
          {form.is_published ? "Publié" : "Brouillon"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Titre *</label>
              <input type="text" value={form.title} onChange={(e) => updateField("title", e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Slug</label>
              <input type="text" value={form.slug} onChange={(e) => updateField("slug", e.target.value)} className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900" />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Extrait</label>
              <textarea value={form.excerpt} onChange={(e) => updateField("excerpt", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" rows={2} />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Contenu *</label>
              <textarea value={form.content} onChange={(e) => updateField("content", e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 min-h-[400px] font-mono" />
            </div>
          </div>

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

          <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-3">
            <button onClick={() => handleSave()} disabled={saving} className="w-full py-2.5 border border-stone-300 rounded-lg text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              <Save size={16} /> Enregistrer
            </button>
            {form.is_published ? (
              <button onClick={() => handleSave(false)} disabled={saving} className="w-full py-2.5 border border-amber-300 rounded-lg text-sm font-medium text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <EyeOff size={16} /> Dépublier
              </button>
            ) : (
              <button onClick={() => handleSave(true)} disabled={saving} className="w-full bg-stone-900 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                <Eye size={16} /> Publier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
