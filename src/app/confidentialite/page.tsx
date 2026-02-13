import Link from "next/link";

export const metadata = {
  title: "Politique de confidentialité",
  description:
    "Politique de confidentialité et protection des données personnelles de Visionnaire Opticiens.",
};

export default function ConfidentialitePage() {
  return (
    <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-24 lg:py-32">
      <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-stone-400">
        Protection des données
      </span>
      <h1 className="text-4xl md:text-5xl font-extralight text-stone-900 mt-3 mb-12">
        Politique de{" "}
        <span className="font-semibold">confidentialité</span>
      </h1>

      <div className="prose prose-stone prose-sm max-w-none text-stone-500 font-light leading-relaxed space-y-6">
        <h2 className="text-lg font-semibold text-stone-900">
          1. Responsable du traitement
        </h2>
        <p>
          Le responsable du traitement des données personnelles est Visionnaire
          Opticiens, situé au 44 Cours Franklin Roosevelt, 69006 Lyon.
          Contact : contact@visionnaires.fr
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          2. Données collectées
        </h2>
        <p>Nous collectons les données suivantes :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong className="text-stone-700">Données d&apos;identification</strong> : nom,
            prénom, adresse e-mail, téléphone
          </li>
          <li>
            <strong className="text-stone-700">Données de livraison</strong> : adresse
            postale
          </li>
          <li>
            <strong className="text-stone-700">Données de santé</strong> : ordonnance
            optique (uniquement dans le cadre d&apos;une commande de verres
            correcteurs)
          </li>
          <li>
            <strong className="text-stone-700">Données de connexion</strong> : adresse IP,
            navigateur, appareil
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-stone-900">
          3. Finalités du traitement
        </h2>
        <p>Vos données sont utilisées pour :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>La gestion de votre compte client</li>
          <li>Le traitement et le suivi de vos commandes</li>
          <li>La vérification de votre ordonnance par nos opticiens diplômés</li>
          <li>L&apos;envoi de communications commerciales (avec votre consentement)</li>
          <li>L&apos;amélioration de nos services et de votre expérience</li>
        </ul>

        <h2 className="text-lg font-semibold text-stone-900">
          4. Base juridique
        </h2>
        <p>
          Le traitement de vos données repose sur l&apos;exécution d&apos;un
          contrat (commande), votre consentement (newsletter), et nos intérêts
          légitimes (amélioration du service).
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          5. Durée de conservation
        </h2>
        <p>
          Vos données sont conservées pendant la durée de la relation
          commerciale et 3 ans après la dernière interaction. Les données de
          santé (ordonnances) sont conservées pendant 5 ans conformément à la
          réglementation en vigueur.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          6. Partage des données
        </h2>
        <p>
          Vos données peuvent être partagées avec nos sous-traitants techniques
          (hébergement, paiement, livraison) dans la stricte mesure nécessaire
          à l&apos;exécution de nos services. Aucune donnée n&apos;est vendue
          à des tiers.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          7. Vos droits
        </h2>
        <p>
          Conformément au RGPD, vous disposez des droits suivants :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Droit d&apos;accès à vos données</li>
          <li>Droit de rectification</li>
          <li>Droit à l&apos;effacement</li>
          <li>Droit à la limitation du traitement</li>
          <li>Droit à la portabilité</li>
          <li>Droit d&apos;opposition</li>
        </ul>
        <p>
          Pour exercer ces droits, contactez-nous à contact@visionnaires.fr ou
          par courrier au 44 Cours Franklin Roosevelt, 69006 Lyon.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          8. Cookies
        </h2>
        <p>
          Ce site utilise uniquement des cookies essentiels au fonctionnement
          (session d&apos;authentification, panier d&apos;achat). Ces cookies
          sont strictement nécessaires et ne requièrent pas votre consentement.
          Aucun cookie de traçage publicitaire n&apos;est utilisé.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          9. Sécurité
        </h2>
        <p>
          Nous mettons en œuvre les mesures techniques et organisationnelles
          appropriées pour protéger vos données : chiffrement SSL/TLS,
          contrôle d&apos;accès, hébergement sécurisé.
        </p>

        <h2 className="text-lg font-semibold text-stone-900">
          10. Contact CNIL
        </h2>
        <p>
          Si vous estimez que le traitement de vos données constitue une
          violation de vos droits, vous pouvez introduire une réclamation
          auprès de la CNIL (www.cnil.fr).
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
