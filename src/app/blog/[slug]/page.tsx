import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { blogArticles, blogArticlesBySlug } from "@/lib/blog-data";

export async function generateStaticParams() {
  return blogArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = blogArticlesBySlug[slug];
  if (!article) return { title: "Article introuvable" };

  const description = article.content[0].slice(0, 160);

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      publishedTime: article.date,
      authors: ["Visionnaire Opticiens"],
      section: article.category,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description,
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = blogArticlesBySlug[slug];

  if (!article) {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: article.title,
    description: article.content[0].slice(0, 160),
    datePublished: article.date,
    dateModified: article.date,
    author: {
      "@type": "Organization",
      name: "Visionnaire Opticiens",
      url: "https://www.visionnairesopticiens.fr",
    },
    publisher: {
      "@type": "Organization",
      name: "Visionnaire Opticiens",
      url: "https://www.visionnairesopticiens.fr",
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `https://www.visionnairesopticiens.fr/blog/${slug}`,
    },
    articleSection: article.category,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="max-w-[900px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      {/* Back link */}
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-black transition-colors mb-10"
      >
        <ArrowLeft size={16} />
        Retour au blog
      </Link>

      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
            {article.category}
          </span>
          <span className="text-[10px] text-stone-300">•</span>
          <span className="text-[10px] text-stone-400">{article.date}</span>
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-extralight text-stone-900 leading-tight">
          {article.title}
        </h1>
      </div>

      {/* Content */}
      <div className="prose prose-stone prose-lg max-w-none">
        {article.content.map((paragraph, i) => (
          <p
            key={i}
            className="text-stone-500 font-light leading-relaxed mb-6"
          >
            {paragraph}
          </p>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-16 p-8 bg-stone-50 text-center">
        <h3 className="text-lg font-semibold text-stone-900">
          Besoin de conseils personnalisés ?
        </h3>
        <p className="text-sm text-stone-500 mt-2 font-light">
          Nos opticiens diplômés vous accueillent en boutique à Lyon.
        </p>
        <Link
          href="/rendez-vous"
          className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 text-sm font-medium uppercase tracking-[0.1em] hover:bg-stone-800 transition-colors mt-6"
        >
          Prendre rendez-vous
        </Link>
      </div>
    </article>
    </>
  );
}
