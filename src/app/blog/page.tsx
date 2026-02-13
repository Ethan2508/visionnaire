import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "Blog — Conseils optiques et tendances lunettes",
  description:
    "Retrouvez nos articles, conseils d'opticiens et les dernières tendances en lunetterie de luxe.",
};

const articles = [
  {
    slug: "choisir-lunettes-forme-visage",
    title: "Comment choisir ses lunettes selon la forme de son visage",
    excerpt:
      "Le choix d'une monture dépend de la morphologie du visage. Découvrez nos conseils d'expert pour trouver la paire qui sublime vos traits.",
    category: "Conseils",
    date: "12 février 2026",
  },
  {
    slug: "proteger-yeux-hiver",
    title: "Protéger vos yeux en hiver : l'importance des lunettes de soleil",
    excerpt:
      "La neige réfléchit jusqu'à 80% des UV. Nos opticiens vous expliquent pourquoi les lunettes de soleil sont essentielles toute l'année.",
    category: "Santé visuelle",
    date: "5 février 2026",
  },
  {
    slug: "tendances-lunettes-2025",
    title: "Les tendances lunettes 2025 : ce qu'il faut retenir",
    excerpt:
      "Montures oversize, acétate coloré, métal précieux... Tour d'horizon des tendances qui marqueront l'année en lunetterie de luxe.",
    category: "Tendances",
    date: "28 janvier 2026",
  },
  {
    slug: "verres-progressifs-guide",
    title: "Verres progressifs : le guide complet pour bien choisir",
    excerpt:
      "Confort, adaptation, technologies disponibles... Tout ce que vous devez savoir avant de passer aux verres progressifs.",
    category: "Conseils",
    date: "15 janvier 2026",
  },
  {
    slug: "lumiere-bleue-ecrans",
    title: "Lumière bleue et écrans : faut-il s'en protéger ?",
    excerpt:
      "Entre mythe et réalité, nos opticiens font le point sur la lumière bleue et les solutions de protection adaptées à votre quotidien.",
    category: "Santé visuelle",
    date: "8 janvier 2026",
  },
  {
    slug: "entretenir-lunettes-luxe",
    title: "Comment entretenir ses lunettes de luxe",
    excerpt:
      "Nettoyage, rangement, ajustement... Les bons gestes pour préserver la beauté et la longévité de vos montures haut de gamme.",
    category: "Conseils",
    date: "2 janvier 2026",
  },
];

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
        {articles.map((article) => (
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
