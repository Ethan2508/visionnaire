import Link from "next/link";

export const metadata = {
  title: "Conditions Générales de Vente",
  description: "Conditions générales de vente de Visionnaire Opticiens.",
};

export default function CGVPage() {
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
        Informations légales
      </span>
      <h1 className="text-4xl md:text-5xl font-extralight text-stone-900 mt-3 mb-12">
        Conditions générales{" "}
        <span className="font-semibold">de vente</span>
      </h1>

      <div className="prose prose-stone prose-sm max-w-none text-stone-500 font-light leading-relaxed space-y-6">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 1 — Objet
        </h2>
        <p>
          Les présentes conditions générales de vente (CGV) régissent les ventes
          de produits effectuées par Visionnaire Opticiens, situé au 44 Cours
          Franklin Roosevelt, 69006 Lyon, auprès de ses clients, tant en
          boutique qu&apos;en ligne via le site internet.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 2 — Produits
        </h2>
        <p>
          Les produits proposés sont des lunettes de vue, lunettes de soleil,
          verres correcteurs et accessoires d&apos;optique. Chaque produit est
          décrit avec la plus grande exactitude possible. Les photographies
          illustrant les produits n&apos;entrent pas dans le champ contractuel.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 3 — Prix
        </h2>
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises (TTC). Ils
          sont susceptibles d&apos;être modifiés à tout moment, étant entendu
          que le prix applicable est celui en vigueur au moment de la validation
          de la commande par le client.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 4 — Commande
        </h2>
        <p>
          Le client passe commande en ligne via le site internet ou en boutique.
          Toute commande implique l&apos;acceptation des présentes conditions
          générales de vente. La vente sera considérée comme définitive après
          l&apos;envoi de la confirmation de commande.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 5 — Paiement
        </h2>
        <p>
          Le paiement s&apos;effectue par carte bancaire (Visa, Mastercard) ou
          en plusieurs fois sans frais via Alma (2x, 3x, 4x). Le débit est
          effectué au moment de la validation de la commande.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 6 — Livraison
        </h2>
        <p>
          La livraison est offerte à partir de 150€ d&apos;achat. Les délais de
          livraison sont donnés à titre indicatif. Pour les lunettes de vue,
          le délai de fabrication des verres est de 5 à 14 jours ouvrés selon
          la correction.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 7 — Droit de rétractation
        </h2>
        <p>
          Conformément à la législation en vigueur, le client dispose d&apos;un
          délai de 14 jours à compter de la réception de sa commande pour
          exercer son droit de rétractation, sans avoir à justifier de motif.
          Les verres correcteurs réalisés sur mesure sont exclus du droit de
          rétractation.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 8 — Garantie
        </h2>
        <p>
          Toutes nos montures bénéficient d&apos;une garantie de 2 ans contre
          les défauts de fabrication. Cette garantie ne couvre pas l&apos;usure
          normale, les rayures ou les dommages causés par un usage inapproprié.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 9 — Données personnelles
        </h2>
        <p>
          Les informations collectées sont nécessaires au traitement des
          commandes. Elles sont traitées conformément à notre{" "}
          <Link
            href="/confidentialite"
            className="underline hover:text-black transition-colors"
          >
            politique de confidentialité
          </Link>
          .
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          Article 10 — Litiges
        </h2>
        <p>
          Les présentes CGV sont soumises au droit français. En cas de litige,
          le client peut recourir à une procédure de médiation conventionnelle
          ou à tout autre mode alternatif de règlement des différends. À défaut,
          les tribunaux de Lyon seront seuls compétents.
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
