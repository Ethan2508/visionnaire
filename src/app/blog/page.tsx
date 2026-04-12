import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogArticles } from "@/lib/blog-data";

export const metadata = {
  title: "Blog — Conseils optiques et tendances lunettes",
  description:
    "Retrouvez nos articles, conseils d'opticiens et les dernières tendances en lunetterie de luxe.",
};

export default function BlogPage() {
  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      {/* Header */}
      <div className="max-w-2xl mb-16">
        <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
          Le journal
        </span>
        <h1 className="text-4xl md:text-5xl font-extralight text-stone-900 mt-3">
          Nos <span className="font-semibold">articles</span>
        </h1>
        <p className="text-stone-500 mt-4 leading-relaxed font-light">
          Conseils d&apos;opticiens, tendances lunettes et santé visuelle.
          Retrouvez toute notre expertise au service de votre regard.
        </p>
      </div>

      {/* Articles list */}
      <div className="divide-y divide-stone-100">
        {blogArticles.map((article) => (
          <article key={article.slug} className="group py-8 first:pt-0">
            <Link href={`/blog/${article.slug}`} className="block">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                  {article.category}
                </span>
                <span className="text-[10px] text-stone-300">•</span>
                <span className="text-[10px] text-stone-400">
                  {article.date}
                </span>
              </div>
              <h2 className="text-xl font-medium text-stone-900 group-hover:text-stone-600 transition-colors leading-snug">
                {article.title}
              </h2>
              <p className="text-sm text-stone-500 mt-2 leading-relaxed font-light max-w-2xl">
                {article.excerpt}
              </p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-900 mt-4 group-hover:gap-2 transition-all">
                Lire l&apos;article{" "}
                <ArrowRight size={14} />
              </span>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
