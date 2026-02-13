import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

const articles: Record<
  string,
  {
    title: string;
    category: string;
    date: string;
    content: string[];
  }
> = {
  "choisir-lunettes-forme-visage": {
    title: "Comment choisir ses lunettes selon la forme de son visage",
    category: "Conseils",
    date: "12 février 2026",
    content: [
      "Le choix d'une monture de lunettes est bien plus qu'une simple question d'esthétique. C'est un exercice d'harmonie entre la forme de votre visage, votre personnalité et votre mode de vie. Chez Visionnaire Opticiens, nos experts vous accompagnent pour trouver la paire qui sublime vos traits.",
      "Pour un visage rond, caractérisé par des courbes douces et des proportions équilibrées, privilégiez les montures anguleuses ou rectangulaires qui apporteront de la structure. Les formes carrées ou géométriques créent un contraste élégant qui affine naturellement les traits.",
      "Les visages carrés, avec leur mâchoire marquée et leur front large, s'adoucissent idéalement avec des montures rondes ou ovales. Les formes papillon ou œil de chat sont également de très bons choix qui apportent féminité et caractère.",
      "Le visage ovale est considéré comme la forme la plus polyvalente : presque toutes les montures lui conviennent. C'est l'occasion d'oser des formes originales, des montures oversize ou des designs avant-gardistes issus de maisons comme Dior, Gucci ou Prada.",
      "Pour un visage en cœur (front large, menton fin), optez pour des montures qui équilibrent les proportions : des formes arrondies en bas de la monture, des lignes légères et des matériaux fins comme le titane japonais.",
      "N'oubliez pas que la taille de la monture est tout aussi importante que sa forme. Une monture trop grande ou trop petite déséquilibre l'harmonie du visage. Nos opticiens mesurent l'écart pupillaire, la hauteur de montage et la largeur du visage pour garantir un ajustement parfait.",
      "Venez en boutique pour un essayage personnalisé. Nos experts prendront le temps de vous conseiller parmi notre sélection de plus de 5 000 montures des plus grandes maisons de luxe.",
    ],
  },
  "proteger-yeux-hiver": {
    title: "Protéger vos yeux en hiver : l'importance des lunettes de soleil",
    category: "Santé visuelle",
    date: "5 février 2026",
    content: [
      "On associe souvent les lunettes de soleil à l'été, aux plages et aux terrasses ensoleillées. Pourtant, la protection de vos yeux en hiver est tout aussi cruciale, voire plus importante dans certaines situations.",
      "La neige réfléchit jusqu'à 80% des rayons UV, contre seulement 10 à 25% pour le sable. En montagne, l'altitude amplifie encore l'exposition : l'intensité des UV augmente de 10% tous les 1 000 mètres. Sans protection adaptée, vous vous exposez à des risques sérieux comme l'ophtalmie des neiges, une véritable brûlure de la cornée.",
      "Mais même en ville, les jours d'hiver lumineux présentent des dangers. Le soleil bas sur l'horizon provoque un éblouissement plus direct qu'en été. La réverbération sur les surfaces mouillées ou givrées accentue cette exposition. Vos yeux travaillent davantage dans ces conditions, ce qui peut provoquer fatigue visuelle, maux de tête et inconfort.",
      "Pour une protection optimale en hiver, choisissez des verres avec une filtration UV de catégorie 3, voire 4 pour les sports de neige. Les verres polarisés sont particulièrement recommandés car ils éliminent les reflets parasites sur les surfaces réfléchissantes.",
      "Chez Visionnaire Opticiens, nous proposons des verres solaires haute performance intégrant les technologies les plus avancées : verres photochromiques qui s'adaptent automatiquement à la luminosité, traitements anti-reflets multicouches et verres polarisants de dernière génération.",
      "Nos opticiens vous conseilleront la protection la plus adaptée à vos activités hivernales, que vous soyez skieur, conducteur ou simplement citadin soucieux de la santé de vos yeux.",
    ],
  },
  "tendances-lunettes-2025": {
    title: "Les tendances lunettes 2025 : ce qu'il faut retenir",
    category: "Tendances",
    date: "28 janvier 2026",
    content: [
      "L'année 2025 s'impose comme un tournant dans l'univers de la lunetterie de luxe. Les grandes maisons revisitent les codes classiques avec une audace qui redéfinit les standards de l'élégance optique.",
      "L'acétate coloré fait un retour spectaculaire. Fini les montures noires uniformes : les collections de Prada, Miu Miu et Fendi explosent de couleurs — bordeaux profond, vert sauge, bleu cobalt et même orange brûlé. Ces teintes sont travaillées dans des acétates haute densité, polis à la main pour un rendu quasi-joaillier.",
      "Le métal précieux reste incontournable, mais se fait plus architectural. Cartier et Fred proposent des structures en titane façonnées avec une précision millimétrique, où chaque branche devient une œuvre de design. Les finitions or rose et palladium dominent, apportant une touche de sophistication subtile.",
      "Les formes oversize continuent leur progression, mais avec plus de finesse. Exit les montures massives des années précédentes : en 2025, l'oversize rime avec légèreté. Dior et Gucci excellent dans cet exercice, proposant des montures imposantes qui ne pèsent que quelques grammes grâce à des matériaux haute technologie.",
      "Le style aviateur se réinvente. Longtemps réservé aux lunettes de soleil masculines, il se transforme en 2025 en une forme unisexe et contemporaine. Les ponts doubles se font plus fins, les verres s'agrandissent et les combinaisons métal-acétate créent des pièces d'exception.",
      "Enfin, la lunetterie « quiet luxury » s'impose comme une tendance de fond. Des montures minimalistes, sans logo apparent, mais reconnaissables par la qualité des matériaux et la perfection des finitions. C'est l'approche défendue par des maisons comme Fred et Montblanc — un luxe discret qui parle à ceux qui savent.",
      "Rendez-vous en boutique pour découvrir ces tendances et trouver votre style parmi notre sélection curated de plus de 200 marques.",
    ],
  },
  "verres-progressifs-guide": {
    title: "Verres progressifs : le guide complet pour bien choisir",
    category: "Conseils",
    date: "15 janvier 2026",
    content: [
      "Les verres progressifs représentent une avancée majeure en optique. Ils permettent de corriger simultanément la vision de loin, intermédiaire et de près, le tout dans un seul verre, sans ligne de démarcation visible.",
      "L'adaptation aux verres progressifs est une étape clé. La plupart des porteurs s'habituent en 1 à 2 semaines. Pendant cette période, votre cerveau apprend à utiliser les différentes zones du verre. Nos opticiens vous accompagnent avec des conseils personnalisés pour faciliter cette transition.",
      "La qualité du verre progressif fait une différence énorme. Les verres d'entrée de gamme offrent des couloirs de progression étroits et des zones de distorsion latérale importantes. Les verres haute performance, comme ceux que nous proposons chez Visionnaire Opticiens, bénéficient de technologies de surfaçage numérique qui élargissent les zones de vision utile.",
      "Le centrage est crucial. Un verre progressif mal centré, même de 1 millimètre, peut provoquer inconfort, fatigue visuelle et maux de tête. C'est pourquoi nous utilisons des équipements de mesure de dernière génération pour un centrage au dixième de millimètre.",
      "Le choix de la monture influence directement le confort des progressifs. Une monture avec une hauteur de verre suffisante (minimum 30mm) garantit que toutes les zones de vision sont accessibles. Nos opticiens vous guident vers les montures les plus adaptées.",
      "N'attendez pas trop pour passer aux progressifs. Plus on commence tôt (dès les premiers signes de presbytie, généralement autour de 45 ans), plus l'adaptation est facile et naturelle.",
    ],
  },
  "lumiere-bleue-ecrans": {
    title: "Lumière bleue et écrans : faut-il s'en protéger ?",
    category: "Santé visuelle",
    date: "8 janvier 2026",
    content: [
      "Nous passons en moyenne 7 heures par jour devant un écran. Ordinateur, smartphone, tablette — nos yeux sont constamment exposés à la lumière bleue artificielle. Mais cette lumière est-elle réellement dangereuse ?",
      "La lumière bleue se divise en deux catégories. La lumière bleu-violet (380-450nm), la plus énergétique, est suspectée de contribuer à la fatigue visuelle et potentiellement à la dégénérescence maculaire à long terme. La lumière bleu-turquoise (450-500nm), en revanche, est bénéfique : elle régule notre horloge biologique et notre humeur.",
      "Les études scientifiques actuelles montrent que la quantité de lumière bleue émise par les écrans est bien inférieure à celle du soleil. Le risque de dommage direct sur la rétine par les écrans seuls reste donc limité selon l'ANSES (Agence nationale de sécurité sanitaire).",
      "En revanche, l'impact sur le confort visuel est bien réel. La fatigue visuelle numérique (ou syndrome de vision informatique) touche près de 65% des utilisateurs réguliers d'écrans. Symptômes typiques : yeux secs, vision trouble temporaire, maux de tête et sensation de fatigue en fin de journée.",
      "Les verres anti-lumière bleue filtrent sélectivement la fraction nocive (bleu-violet) tout en laissant passer les longueurs d'onde bénéfiques. Chez Visionnaire Opticiens, nous proposons plusieurs niveaux de filtration adaptés à votre exposition et à vos habitudes.",
      "Au-delà des verres, de bonnes habitudes sont essentielles : la règle du 20-20-20 (toutes les 20 minutes, regarder à 20 pieds — 6 mètres — pendant 20 secondes), un éclairage ambiant adapté, et limiter l'exposition aux écrans avant le coucher pour préserver la qualité du sommeil.",
      "Consultez nos opticiens pour un bilan personnalisé et des recommandations adaptées à votre mode de vie numérique.",
    ],
  },
  "entretenir-lunettes-luxe": {
    title: "Comment entretenir ses lunettes de luxe",
    category: "Conseils",
    date: "2 janvier 2026",
    content: [
      "Des lunettes de luxe méritent un entretien à la hauteur de leur qualité. Avec les bons gestes, vos montures Cartier, Dior ou Fred conserveront leur éclat et leur confort pendant des années.",
      "Le nettoyage quotidien est l'étape la plus importante. Utilisez toujours une lingette microfibre propre — jamais de mouchoir en papier, de vêtement ou d'essuie-tout qui pourraient rayer les verres. Passez d'abord vos lunettes sous l'eau tiède pour éliminer les poussières, puis nettoyez délicatement avec un produit adapté.",
      "Évitez absolument les produits ménagers, le vinaigre, l'alcool pur ou le lave-vitre sur vos verres. Ces produits peuvent endommager les traitements anti-reflets, anti-rayures et hydrophobes qui protègent vos verres. Optez pour un spray nettoyant optique fourni par votre opticien.",
      "Le rangement est souvent négligé. Rangez toujours vos lunettes dans leur étui rigide lorsque vous ne les portez pas. Posez-les toujours verres vers le haut pour éviter les rayures. En voiture, ne les laissez jamais sur le tableau de bord : la chaleur peut déformer les montures en acétate.",
      "L'ajustement régulier est essentiel. Avec le temps, les branches se desserrent, le nez s'étire et l'alignement se perd. Chez Visionnaire Opticiens, nous proposons un service gratuit d'ajustement et de nettoyage professionnel. N'hésitez pas à passer en boutique tous les 3 à 6 mois.",
      "Pour les montures en acétate, une fine couche d'huile naturelle (huile de jojoba par exemple) peut raviver la brillance. Pour les montures métalliques, un passage délicat avec un chiffon sec suffit. Évitez tout contact prolongé avec l'eau de mer, le chlore ou les parfums qui peuvent altérer les finitions.",
      "Enfin, faites contrôler les vis et charnières de vos montures régulièrement. Un serrage préventif évite les mauvaises surprises. Notre atelier est équipé pour intervenir sur toutes les marques que nous proposons.",
    ],
  },
};

export async function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles[slug];
  if (!article) return { title: "Article introuvable" };
  return {
    title: article.title,
    description: article.content[0].slice(0, 160),
  };
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = articles[slug];

  if (!article) {
    notFound();
  }

  return (
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
  );
}
