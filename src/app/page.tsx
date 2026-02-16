import Link from "next/link";
import Image from "next/image";
import Script from "next/script";
import { createClient } from "@supabase/supabase-js";
import {
  ArrowRight,
  CalendarDays,
  Truck,
  CreditCard,
  ShieldCheck,
  Award,
  Eye,
  Sparkles,
  Clock,
  CheckCircle2,
  ChevronRight,
  Mail,
} from "lucide-react";
import AnimatedSection from "@/components/home/AnimatedSection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import NewsletterForm from "@/components/home/NewsletterForm";

/* ─── Static Data ─── */

const categories = [
  {
    title: "Solaire Femme",
    subtitle: "Élégance et protection",
    image: "/images/hero/collection-femme.webp",
    href: "/catalogue?categorie=soleil&genre=femme",
  },
  {
    title: "Solaire Homme",
    subtitle: "Style et performance",
    image: "/images/hero/collection-homme.webp",
    href: "/catalogue?categorie=soleil&genre=homme",
  },
  {
    title: "Optique Femme",
    subtitle: "Raffinement au quotidien",
    image: "/images/hero/lunettes-vue-femme.avif",
    href: "/catalogue?categorie=vue&genre=femme",
  },
  {
    title: "Optique Homme",
    subtitle: "Précision et caractère",
    image: "/images/hero/lunettes-vue-homme.webp",
    href: "/catalogue?categorie=vue&genre=homme",
  },
];

const reassurance = [
  {
    icon: Truck,
    title: "Livraison offerte",
    description: "Dès 150€ d'achat en France",
  },
  {
    icon: CreditCard,
    title: "Paiement 2x 3x 4x",
    description: "Sans frais avec Alma",
  },
  {
    icon: ShieldCheck,
    title: "Qualité certifiée",
    description: "Montures authentiques garanties",
  },
  {
    icon: Award,
    title: "Garantie 2 ans",
    description: "Sur toutes nos montures",
  },
];

const services = [
  {
    icon: Eye,
    title: "Examen de vue",
    description:
      "Un bilan visuel complet réalisé par nos opticiens diplômés avec les équipements les plus avancés.",
  },
  {
    icon: Sparkles,
    title: "Essayage personnalisé",
    description:
      "Essayez nos montures en boutique avec les conseils de nos experts pour trouver le modèle parfait.",
  },
  {
    icon: CheckCircle2,
    title: "Verres sur mesure",
    description:
      "Des verres adaptés à votre correction, votre mode de vie et vos habitudes visuelles.",
  },
  {
    icon: Clock,
    title: "Ajustement & entretien",
    description:
      "Service gratuit d'ajustement et d'entretien de vos lunettes en boutique.",
  },
];

const articles = [
  {
    title: "Comment choisir ses lunettes selon la forme de son visage",
    excerpt:
      "Le choix d'une monture dépend de la morphologie du visage. Découvrez nos conseils d'expert pour trouver la paire parfaite.",
    category: "Conseils",
    image: "/images/hero/collection-femme.webp",
    href: "/blog",
  },
  {
    title: "Protéger vos yeux en hiver : l'importance des lunettes de soleil",
    excerpt:
      "La neige réfléchit jusqu'à 80% des UV. Nos opticiens vous expliquent pourquoi les lunettes de soleil sont essentielles toute l'année.",
    category: "Santé visuelle",
    image: "/images/hero/collection-homme.webp",
    href: "/blog",
  },
  {
    title: "Les tendances lunettes 2025 : ce qu'il faut retenir",
    excerpt:
      "Montures oversize, acétate coloré, métal précieux... Tour d'horizon des tendances qui marqueront cette année.",
    category: "Tendances",
    image: "/images/hero/fred.webp",
    href: "/blog",
  },
];

const faqItems = [
  {
    question: "Comment choisir la bonne monture pour mon visage ?",
    answer:
      "Les visages ronds s'accordent avec des montures anguleuses, les visages carrés avec des formes arrondies. Les visages ovales peuvent porter presque tous les styles. Nos opticiens vous accompagnent en boutique pour trouver la monture qui met le mieux en valeur vos traits.",
  },
  {
    question: "Acceptez-vous les retours et échanges ?",
    answer:
      "Oui, vous disposez de 30 jours après réception pour retourner ou échanger votre monture. L'article doit être dans son état d'origine avec tous ses accessoires.",
  },
  {
    question: "Quels sont les délais de livraison ?",
    answer:
      "Les commandes sont expédiées sous 24 à 48h. Comptez ensuite 2 à 4 jours ouvrés pour la livraison à domicile. La livraison est offerte dès 150€ d'achat.",
  },
  {
    question: "Proposez-vous le paiement en plusieurs fois ?",
    answer:
      "Oui, nous proposons le paiement en 2x, 3x et 4x sans frais grâce à notre partenaire Alma. Cette option est disponible en boutique comme en ligne pour tous les achats.",
  },
  {
    question: "Les lunettes sont-elles prises en charge par la mutuelle ?",
    answer:
      "Oui, nous sommes agréés par la Sécurité sociale et toutes les mutuelles. Nous vous aidons dans vos démarches de remboursement et pouvons pratiquer le tiers payant.",
  },
];

/* ─── Page Component ─── */

export default async function HomePage() {
  // Pre-fetch featured products server-side to avoid client waterfall
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialProducts: any[] = [];
  let initialType = "featured";
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: featured } = await supabase
      .from("products")
      .select(
        "id, name, slug, base_price, category, gender, brand_id, brands(name, slug), product_images(url, alt_text, is_primary)"
      )
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(8);

    if (featured && featured.length > 0) {
      initialProducts = featured;
      initialType = "featured";
    } else {
      const { data: latest } = await supabase
        .from("products")
        .select(
          "id, name, slug, base_price, category, gender, brand_id, brands(name, slug), product_images(url, alt_text, is_primary)"
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(8);
      initialProducts = latest || [];
      initialType = "latest";
    }
  } catch {
    // Fail silently — client will fetch as fallback
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://visionnaireopticiens.vercel.app";

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${siteUrl}/#organization`,
    name: "Visionnaire Opticiens",
    description: "Votre opticien de confiance à Lyon. Lunettes de vue, soleil, ski et sport des plus grandes marques de luxe.",
    url: siteUrl,
    telephone: "+33478526222",
    email: "contact@visionnaires.fr",
    address: {
      "@type": "PostalAddress",
      streetAddress: "44 Cours Franklin Roosevelt",
      addressLocality: "Lyon",
      postalCode: "69006",
      addressCountry: "FR",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 45.7676,
      longitude: 4.8512,
    },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Monday", opens: "14:00", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "10:00", closes: "19:00" },
    ],
    priceRange: "€€€",
    image: `${siteUrl}/images/hero/collection-femme.webp`,
    sameAs: [],
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <div className="overflow-hidden">
      {/* JSON-LD Structured Data */}
      <Script
        id="org-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Script
        id="faq-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {/* ═══════════════════════════════════════════
          1. HERO — Cinematic full-viewport
      ═══════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[700px] overflow-hidden">
        {/* Background image with slow zoom */}
        <div className="absolute inset-0 animate-slow-zoom">
          <Image
            src="/images/hero/collection-femme.webp"
            alt="Collection Visionnaire Opticiens"
            fill
            sizes="100vw"
            className="object-cover"
            priority
          />
        </div>

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full">
            <div className="max-w-2xl">
              <span className="animate-hero-text text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50 mb-6 block">
                Optique de luxe — Lyon
              </span>

              <h1 className="animate-hero-text-delay-1 text-5xl md:text-6xl lg:text-[80px] font-extralight text-white leading-[1.05] tracking-tight">
                Votre regard,
                <br />
                <span className="font-semibold">notre vision.</span>
              </h1>

              <div className="animate-hero-line w-16 h-[1px] bg-white/30 mt-8 mb-8" />

              <p className="animate-hero-text-delay-3 text-base md:text-lg text-white/60 leading-relaxed max-w-lg font-light">
                Découvrez une sélection exclusive de lunettes des plus grandes
                maisons. Expertise optique, conseils personnalisés et service
                d&apos;exception.
              </p>

              <div className="animate-hero-text-delay-4 mt-10 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/catalogue"
                  className="inline-flex items-center justify-center gap-2.5 bg-white text-black px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-white/90 transition-all duration-300 group"
                >
                  Explorer le catalogue
                  <ArrowRight
                    size={16}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/rendez-vous"
                  className="inline-flex items-center justify-center gap-2.5 border border-white/30 text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-white/10 hover:border-white/50 transition-all duration-300"
                >
                  <CalendarDays size={16} />
                  Prendre rendez-vous
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-hero-fade">
          <div className="flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/30">
              Scroll
            </span>
            <div className="w-[1px] h-8 bg-gradient-to-b from-white/40 to-transparent" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. REASSURANCE BAR
      ═══════════════════════════════════════════ */}
      <section className="bg-white border-b border-stone-100">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-7">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {reassurance.map((item) => (
              <div key={item.title} className="flex items-center gap-3">
                <div className="p-2.5 bg-stone-50 rounded-lg shrink-0">
                  <item.icon size={18} className="text-stone-600" />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-stone-400 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. CATEGORIES — 2x2 Grid avec hover premium
      ═══════════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              Explorez nos univers
            </span>
            <h2 className="text-3xl md:text-5xl font-extralight text-stone-900 mt-3">
              Trouvez votre{" "}
              <span className="font-semibold">style</span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((cat, index) => (
            <AnimatedSection key={cat.title} delay={index * 100}>
              <Link
                href={cat.href}
                className="group relative aspect-[4/3] overflow-hidden block img-zoom"
              >
                <Image
                  src={cat.image}
                  alt={cat.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-all duration-500" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-10">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/50">
                    {cat.subtitle}
                  </span>
                  <h3 className="text-2xl md:text-3xl font-light text-white mt-1 tracking-wide">
                    {cat.title}
                  </h3>
                  <span className="inline-flex items-center gap-1.5 text-white/60 text-sm mt-3 group-hover:text-white group-hover:gap-3 transition-all duration-300">
                    Découvrir <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. BRAND SPOTLIGHT — Sections pleine largeur alternées
      ═══════════════════════════════════════════ */}
      <section className="bg-stone-950">
        {/* Brand 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          <AnimatedSection direction="left" className="relative">
            <div className="absolute inset-0">
              <Image
                src="/images/hero/fred.webp"
                alt="Collection Fred"
                fill
                sizes="50vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </AnimatedSection>
          <AnimatedSection
            direction="right"
            className="flex items-center px-8 md:px-16 lg:px-20 py-16 lg:py-0"
          >
            <div className="max-w-md">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
                Collection exclusive
              </span>
              <h3 className="text-4xl md:text-5xl font-extralight text-white mt-4 leading-tight">
                L&apos;univers{" "}
                <span className="font-semibold">Fred</span>
              </h3>
              <p className="text-white/40 mt-6 leading-relaxed font-light">
                Symbole d&apos;élégance à la française, Fred incarne depuis
                1936 l&apos;art de vivre parisien. Découvrez des montures
                audacieuses où se mêlent joaillerie et innovation optique.
              </p>
              <Link
                href="/marques/fred"
                className="inline-flex items-center gap-2 text-white text-sm font-medium uppercase tracking-[0.15em] mt-8 group hover:gap-3 transition-all"
              >
                Découvrir la collection
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </AnimatedSection>
        </div>

        {/* Brand 2 — reversed */}
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
          <AnimatedSection
            direction="left"
            className="flex items-center px-8 md:px-16 lg:px-20 py-16 lg:py-0 order-2 lg:order-1"
          >
            <div className="max-w-md">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/30">
                Streetwear & luxe
              </span>
              <h3 className="text-4xl md:text-5xl font-extralight text-white mt-4 leading-tight">
                Palm{" "}
                <span className="font-semibold">Angels</span>
              </h3>
              <p className="text-white/40 mt-6 leading-relaxed font-light">
                Née à Los Angeles, Palm Angels fusionne l&apos;énergie du
                skateboard avec le luxe contemporain. Des lunettes qui
                affirment un style audacieux et avant-gardiste.
              </p>
              <Link
                href="/marques/palm-angels"
                className="inline-flex items-center gap-2 text-white text-sm font-medium uppercase tracking-[0.15em] mt-8 group hover:gap-3 transition-all"
              >
                Découvrir la collection
                <ArrowRight
                  size={16}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </AnimatedSection>
          <AnimatedSection
            direction="right"
            className="relative order-1 lg:order-2"
          >
            <div className="absolute inset-0">
              <Image
                src="/images/hero/collection-homme.webp"
                alt="Collection Palm Angels"
                fill
                sizes="50vw"
                className="object-cover"
                loading="lazy"
              />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. FEATURED / RECOMMENDED PRODUCTS (Client Component)
      ═══════════════════════════════════════════ */}
      <FeaturedProducts initialProducts={initialProducts} initialType={initialType} />

      {/* ═══════════════════════════════════════════
          6. EXPERTISE — L'art de l'optique
      ═══════════════════════════════════════════ */}
      <section className="bg-stone-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <AnimatedSection direction="left">
              <div className="relative">
                <div className="aspect-[4/5] relative overflow-hidden">
                  <Image
                    src="/images/hero/lunettes-vue-femme.avif"
                    alt="Expertise Visionnaire Opticiens"
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                {/* Floating badge */}
                <div className="absolute -bottom-6 -right-6 bg-white shadow-xl p-6 hidden md:block">
                  <div className="text-4xl font-extralight text-stone-900">
                    25<span className="text-lg font-medium">+</span>
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">
                    Années d&apos;expertise
                  </div>
                </div>
              </div>
            </AnimatedSection>

            <AnimatedSection direction="right">
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                Notre expertise
              </span>
              <h2 className="text-3xl md:text-5xl font-extralight text-stone-900 mt-3 leading-tight">
                L&apos;art de{" "}
                <span className="font-semibold">l&apos;optique</span>
              </h2>
              <div className="w-12 h-[1px] bg-stone-300 mt-6 mb-8" />
              <p className="text-stone-500 leading-relaxed font-light">
                Chez Visionnaire Opticiens, chaque paire de lunettes est bien
                plus qu&apos;un simple accessoire. C&apos;est l&apos;expression de votre
                personnalité, un objet de design façonné avec précision, un
                compagnon de votre quotidien.
              </p>
              <p className="text-stone-500 leading-relaxed font-light mt-4">
                Notre équipe d&apos;opticiens diplômés vous accompagne dans le choix
                de la monture idéale, l&apos;adaptation de verres haute performance
                et un suivi personnalisé tout au long de la vie de vos lunettes.
                Nous sélectionnons exclusivement des maisons reconnues pour leur
                savoir-faire, leurs matériaux nobles et leur exigence de qualité.
              </p>

              <div className="grid grid-cols-3 gap-6 mt-10 pt-10 border-t border-stone-200">
                <div>
                  <div className="text-2xl font-light text-stone-900">200+</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mt-1">
                    Marques
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-light text-stone-900">5 000+</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mt-1">
                    Montures
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-light text-stone-900">98%</div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-stone-400 mt-1">
                    Satisfaction
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          7. SERVICES — Grid premium
      ═══════════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
        <AnimatedSection>
          <div className="text-center mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
              À votre service
            </span>
            <h2 className="text-3xl md:text-5xl font-extralight text-stone-900 mt-3">
              Nos{" "}
              <span className="font-semibold">services</span>
            </h2>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200">
          {services.map((service, index) => (
            <AnimatedSection key={service.title} delay={index * 100}>
              <div className="bg-white p-8 lg:p-10 h-full group hover:bg-stone-50 transition-colors duration-300">
                <div className="p-3 bg-stone-50 rounded-lg w-fit group-hover:bg-white transition-colors">
                  <service.icon size={22} className="text-stone-700" />
                </div>
                <h3 className="text-base font-semibold text-stone-900 mt-6 tracking-wide">
                  {service.title}
                </h3>
                <p className="text-sm text-stone-400 mt-3 leading-relaxed font-light">
                  {service.description}
                </p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8. CTA RENDEZ-VOUS — Grande section immersive
      ═══════════════════════════════════════════ */}
      <section className="relative min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/hero/fred.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/65" />
        </div>
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
          <AnimatedSection className="text-center max-w-2xl mx-auto">
            <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/40">
              Rendez-vous en boutique
            </span>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-extralight text-white mt-4 leading-tight">
              Besoin de <span className="font-semibold">conseils ?</span>
            </h2>
            <p className="text-white/50 mt-6 text-base md:text-lg leading-relaxed font-light max-w-lg mx-auto">
              Nos opticiens diplômés vous accueillent pour un examen de vue, un
              essayage personnalisé ou des conseils sur vos verres correcteurs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
              <Link
                href="/rendez-vous"
                className="inline-flex items-center gap-2.5 bg-white text-black px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-white/90 transition-all group"
              >
                <CalendarDays size={16} />
                Prendre rendez-vous
              </Link>
              <a
                href="tel:+33478526222"
                className="inline-flex items-center gap-2.5 border border-white/30 text-white px-8 py-4 text-sm font-medium uppercase tracking-[0.15em] hover:bg-white/10 transition-all"
              >
                Appeler : 04 78 52 62 22
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9. ARTICLES / BLOG — Preview grid
      ═══════════════════════════════════════════ */}
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
        <AnimatedSection>
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
                Le journal
              </span>
              <h2 className="text-3xl md:text-5xl font-extralight text-stone-900 mt-3">
                Nos{" "}
                <span className="font-semibold">articles</span>
              </h2>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-black transition-colors group"
            >
              Tous les articles{" "}
              <ArrowRight
                size={16}
                className="group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {articles.map((article, index) => (
            <AnimatedSection key={article.title} delay={index * 120}>
              <Link href={article.href} className="group block">
                <div className="relative aspect-[3/2] overflow-hidden img-zoom">
                  <Image
                    src={article.image}
                    alt={article.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="mt-5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                    {article.category}
                  </span>
                  <h3 className="text-lg font-medium text-stone-900 mt-2 group-hover:text-stone-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-stone-400 mt-2 leading-relaxed line-clamp-2 font-light">
                    {article.excerpt}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-stone-900 mt-4 group-hover:gap-2 transition-all">
                    Lire l&apos;article <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          10. BRANDS MARQUEE — Défilement logos
      ═══════════════════════════════════════════ */}
      <section className="bg-stone-50 border-y border-stone-100 py-16 overflow-hidden">
        <AnimatedSection className="text-center mb-10">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
            + de 200 marques
          </span>
          <h2 className="text-2xl md:text-3xl font-extralight text-stone-900 mt-2">
            Nos <span className="font-semibold">partenaires</span>
          </h2>
        </AnimatedSection>

        {/* Marquee logos */}
        <div className="relative w-full overflow-hidden mt-10">
          <div className="flex animate-marquee items-center gap-16 whitespace-nowrap">
            {/* Repeat logos twice for seamless loop */}
            {[...Array(2)].map((_, setIndex) => (
              <div key={setIndex} className="flex items-center gap-16 shrink-0">
                {/* Cartier — 3.4:1 wide text */}
                <Image
                  src="/images/brands/cartier.svg"
                  alt="Cartier"
                  width={130}
                  height={38}
                  className="h-[26px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Gucci — 1:1 square emblem → needs more height */}
                <Image
                  src="/images/brands/gucci.svg"
                  alt="Gucci"
                  width={40}
                  height={40}
                  className="h-[38px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Prada — 4.4:1 very wide text */}
                <Image
                  src="/images/brands/prada.png"
                  alt="Prada"
                  width={110}
                  height={25}
                  className="h-[22px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Fendi — 3.9:1 wide text */}
                <Image
                  src="/images/brands/fendi.png"
                  alt="Fendi"
                  width={100}
                  height={26}
                  className="h-[22px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Fred — 2.3:1 medium with emblem */}
                <Image
                  src="/images/brands/fred.png"
                  alt="Fred"
                  width={70}
                  height={30}
                  className="h-[30px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* YSL — 4.8:1 very wide text */}
                <Image
                  src="/images/brands/ysl.png"
                  alt="Yves Saint Laurent"
                  width={120}
                  height={25}
                  className="h-[20px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Montblanc — 1:1 square with star emblem */}
                <Image
                  src="/images/brands/montblanc.png"
                  alt="Montblanc"
                  width={40}
                  height={40}
                  className="h-[38px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Off-White — 1.8:1 medium-compact */}
                <Image
                  src="/images/brands/off-white.png"
                  alt="Off-White"
                  width={56}
                  height={32}
                  className="h-[30px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Miu Miu — 4:1 wide text */}
                <Image
                  src="/images/brands/miu-miu.png"
                  alt="Miu Miu"
                  width={100}
                  height={25}
                  className="h-[22px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Palm Angels — 5.3:1 very wide text */}
                <Image
                  src="/images/brands/palm-angels.png"
                  alt="Palm Angels"
                  width={120}
                  height={22}
                  className="h-[18px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Spektre — 3.4:1 wide text, small source */}
                <Image
                  src="/images/brands/spektre.png"
                  alt="Spektre"
                  width={90}
                  height={26}
                  className="h-[22px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
                {/* Dior — 2.3:1 medium text */}
                <Image
                  src="/images/brands/dior.png"
                  alt="Dior"
                  width={80}
                  height={35}
                  className="h-[28px] w-auto opacity-40 hover:opacity-80 transition-opacity"
                />
              </div>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-stone-50 to-transparent pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-stone-50 to-transparent pointer-events-none" />
        </div>

        <div className="text-center mt-10">
          <Link
            href="/marques"
            className="inline-flex items-center gap-2 text-sm font-medium text-stone-500 hover:text-black transition-colors group"
          >
            Voir toutes les marques{" "}
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </Link>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          11. FAQ — Questions fréquentes
      ═══════════════════════════════════════════ */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
        <AnimatedSection className="text-center mb-14">
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
            Besoin d&apos;aide ?
          </span>
          <h2 className="text-3xl md:text-4xl font-extralight text-stone-900 mt-3">
            Questions{" "}
            <span className="font-semibold">fréquentes</span>
          </h2>
        </AnimatedSection>

        <div className="divide-y divide-stone-200">
          {faqItems.map((item, index) => (
            <AnimatedSection key={index} delay={index * 60}>
              <details className="group py-6">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-base font-medium text-stone-900 pr-8 group-hover:text-stone-600 transition-colors">
                    {item.question}
                  </h3>
                  <ChevronRight
                    size={18}
                    className="text-stone-400 shrink-0 transition-transform duration-300 group-open:rotate-90"
                  />
                </summary>
                <p className="text-sm text-stone-500 mt-4 leading-relaxed font-light max-w-2xl">
                  {item.answer}
                </p>
              </details>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          12. NEWSLETTER — CTA premium
      ═══════════════════════════════════════════ */}
      <section className="bg-stone-950">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-24 lg:py-28">
          <AnimatedSection className="max-w-2xl mx-auto text-center">
            <Mail size={28} className="text-white/20 mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-extralight text-white leading-tight">
              Restez{" "}
              <span className="font-semibold">informé</span>
            </h2>
            <p className="text-white/40 mt-4 text-sm leading-relaxed font-light max-w-md mx-auto">
              Nouvelles collections, offres exclusives et conseils de nos
              opticiens directement dans votre boîte mail.
            </p>
            <NewsletterForm />
            <p className="text-[10px] text-white/20 mt-4">
              En vous inscrivant, vous acceptez notre politique de confidentialité.
              Désabonnement en un clic.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          13. SEO CONTENT — Contenu éditorial riche
      ═══════════════════════════════════════════ */}
      <section className="bg-white border-t border-stone-100">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-20 lg:py-24">
          <AnimatedSection>
            <h2 className="text-2xl font-light text-stone-900 mb-6">
              Visionnaire Opticiens :{" "}
              <span className="font-semibold">votre opticien d&apos;exception à Lyon</span>
            </h2>
            <div className="prose prose-stone prose-sm max-w-none text-stone-500 font-light leading-relaxed space-y-4">
              <p>
                Situé au cœur du 6ème arrondissement de Lyon, au 44 Cours
                Franklin Roosevelt, Visionnaire Opticiens incarne une vision
                moderne et exigeante de l&apos;optique de luxe. Notre boutique
                réunit les créations les plus prestigieuses des maisons de luxe
                internationales : Palm Angels, Miu Miu, Off-White, et bien
                d&apos;autres marques emblématiques qui redéfinissent les codes
                de la lunetterie contemporaine.
              </p>
              <p>
                Notre équipe d&apos;opticiens diplômés vous accompagne dans
                chaque étape : du choix de la monture à l&apos;adaptation des
                verres, en passant par un suivi personnalisé. Que vous
                recherchiez des lunettes de vue pour le quotidien, des lunettes
                de soleil pour affirmer votre style, ou des verres progressifs
                haute performance, notre expertise est à votre service.
              </p>
              <p>
                Nous proposons un large choix de verres correcteurs — unifocaux,
                progressifs, mi-distance — équipés des technologies les plus
                avancées : traitement anti-lumière bleue, verres photochromiques,
                traitements hydrophobes et anti-reflets de dernière génération.
                Chaque paire est assemblée avec soin dans notre atelier pour
                garantir un confort visuel optimal.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
