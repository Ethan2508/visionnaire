"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Erreur application:", error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-stone-900 mb-4">
          Une erreur est survenue
        </h1>
        <p className="text-stone-600 mb-8">
          Nous sommes désolés, une erreur inattendue s&apos;est produite.
          Veuillez réessayer.
        </p>
        <div className="flex gap-4 justify-center">
          <button
            onClick={reset}
            className="bg-stone-900 text-white px-6 py-3 text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Réessayer
          </button>
          <Link
            href="/"
            className="border border-stone-300 text-stone-700 px-6 py-3 text-sm font-medium hover:bg-stone-100 transition-colors"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </div>
    </main>
  );
}
