"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";
import { Plus, FileText, Pencil, Trash2, Eye, EyeOff, Search } from "lucide-react";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  is_published: boolean;
  published_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  created_at: string;
  updated_at: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  useEffect(() => { loadPosts(); }, []);

  async function loadPosts() {
    const supabase = createClient();
    const { data } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });
    setPosts((data as unknown as BlogPost[]) || []);
    setLoading(false);
  }

  async function togglePublished(post: BlogPost) {
    const supabase = createClient();
    await supabase.from("blog_posts").update({
      is_published: !post.is_published,
      published_at: !post.is_published ? new Date().toISOString() : null,
    } as never).eq("id", post.id);
    await loadPosts();
  }

  async function deletePost(id: string) {
    if (!confirm("Supprimer cet article ?")) return;
    const supabase = createClient();
    await supabase.from("blog_posts").delete().eq("id", id);
    await loadPosts();
  }

  const filtered = posts.filter((p) => {
    if (filter === "published" && !p.is_published) return false;
    if (filter === "draft" && p.is_published) return false;
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Blog</h1>
          <p className="text-sm text-stone-500 mt-1">{posts.length} article{posts.length > 1 ? "s" : ""}</p>
        </div>
        <Link href="/admin/blog/nouveau" className="inline-flex items-center gap-2 bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
          <Plus size={16} />Nouvel article
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1">
          {(["all", "published", "draft"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? "bg-stone-900 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
              {f === "all" ? "Tous" : f === "published" ? "Publiés" : "Brouillons"}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article..." className="w-full pl-10 pr-4 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-stone-100 rounded-lg animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <FileText size={40} className="mx-auto text-stone-300 mb-3" />
          <p className="text-stone-500">Aucun article trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
          {filtered.map((post) => (
            <div key={post.id} className="flex items-center gap-4 px-4 py-4">
              {post.cover_image_url ? (
                <img src={post.cover_image_url} alt="" className="w-16 h-12 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-16 h-12 rounded-lg bg-stone-100 flex items-center justify-center shrink-0"><FileText size={20} className="text-stone-300" /></div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-stone-900 truncate">{post.title}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${post.is_published ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500"}`}>
                    {post.is_published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-0.5 truncate">{post.excerpt || "Pas d'extrait"}</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {post.is_published && post.published_at
                    ? `Publié le ${new Date(post.published_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`
                    : `Créé le ${new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}`}
                </p>
              </div>
              <button onClick={() => togglePublished(post)} className={`p-2 rounded-lg transition-colors ${post.is_published ? "text-green-600 hover:bg-green-50" : "text-stone-400 hover:bg-stone-50"}`} title={post.is_published ? "Dépublier" : "Publier"}>
                {post.is_published ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <Link href={`/admin/blog/${post.id}`} className="p-2 text-stone-400 hover:text-stone-900 hover:bg-stone-50 rounded-lg transition-colors">
                <Pencil size={16} />
              </Link>
              <button onClick={() => deletePost(post.id)} className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
