import Link from "next/link";

export const metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Visionnaire Opticiens.",
};

export default function MentionsLegalesPage() {
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
        Informations légales
      </span>
      <h1 className="text-4xl md:text-5xl font-extralight text-stone-900 mt-3 mb-12">
        Mentions <span className="font-semibold">légales</span>
      </h1>

      <div className="prose prose-stone prose-sm max-w-none text-stone-500 font-light leading-relaxed space-y-6">
        <h2 className="text-lg font-semibold text-stone-900">Éditeur du site</h2>
        <p>
          <strong className="text-stone-700">Visionnaire Opticiens</strong>
          <br />
          44 Cours Franklin Roosevelt
          <br />
          69006 Lyon, France
          <br />
          Téléphone : +33 4 78 52 62 22
          <br />
          E-mail : contact@visionnaires.fr
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Directeur de la publication
        </h2>
        <p>Le directeur de la publication est le gérant de la société Visionnaire Opticiens.</p>

        <h2 className="text-lg font-semibold text-stone-900">Hébergement</h2>
        <p>
          Ce site est hébergé par :
          <br />
          <strong className="text-stone-700">Vercel Inc.</strong>
          <br />
          440 N Barranca Ave #4133
          <br />
          Covina, CA 91723, États-Unis
          <br />
          Site : vercel.com
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Propriété intellectuelle
        </h2>
        <p>
          L&apos;ensemble du contenu de ce site (textes, images, logos) est la
          propriété exclusive de Visionnaire Opticiens ou de ses partenaires.
          Toute reproduction, représentation, modification ou exploitation, même
          partielle, est interdite sans autorisation écrite préalable.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Données personnelles
        </h2>
        <p>
          Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de
          rectification et de suppression de vos données personnelles. Pour
          plus d&apos;informations, consultez notre{" "}
          <Link
            href="/confidentialite"
            className="underline hover:text-black transition-colors"
          >
            politique de confidentialité
          </Link>
          .
        </p>

        <h2 className="text-lg font-semibold text-stone-900">Cookies</h2>
        <p>
          Ce site utilise des cookies strictement nécessaires à son
          fonctionnement (authentification, panier). Aucun cookie de suivi
          publicitaire n&apos;est utilisé. En naviguant sur ce site, vous
          acceptez l&apos;utilisation de ces cookies essentiels.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Crédits photographiques
        </h2>
        <p>
          Les photographies de produits sont fournies par les marques
          partenaires ou réalisées par Visionnaire Opticiens. Toute
          reproduction est interdite.
        </p>
      </div>

      <div className="mt-12 pt-8 border-t border-stone-200">
        <p className="text-[11px] text-stone-400">
          Dernière mise à jour : février 2026
        </p>
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 hover:text-black transition-colors mt-4 inline-block"
        >
          ← Retour à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
