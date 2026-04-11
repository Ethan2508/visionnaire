import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-light text-stone-300 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-stone-900 mb-4">
          Page introuvable
        </h2>
        <p className="text-stone-600 mb-8">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/"
            className="bg-stone-900 text-white px-6 py-3 text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
          <Link
            href="/catalogue"
            className="border border-stone-300 text-stone-700 px-6 py-3 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            Voir le catalogue
          </Link>
        </div>
      </div>
    </main>
  );
}
