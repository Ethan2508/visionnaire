"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { Check, AlertTriangle, Loader2, ShoppingBag } from "lucide-react";
import { Suspense } from "react";

function AlmaRetourContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { clearCart } = useCartStore();

  const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!orderId) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/alma/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (res.ok && data.success) {
          setOrderNumber(data.orderNumber);
          setStatus("success");
          clearCart();
        } else if (res.status === 402 && retryCount < 5) {
          // Paiement en cours de traitement — réessayer dans 3 secondes
          setStatus("pending");
          setTimeout(() => {
            if (!cancelled) setRetryCount((c) => c + 1);
          }, 3000);
        } else {
          setStatus("error");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    verifyPayment();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, retryCount]);

  if (status === "loading" || status === "pending") {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <Loader2 size={48} className="text-stone-400 animate-spin mx-auto mb-6" />
          <h1 className="text-xl font-semibold text-stone-900 mb-2">
            Vérification du paiement…
          </h1>
          <p className="text-stone-500">
            {status === "pending"
              ? "Votre paiement est en cours de traitement. Veuillez patienter quelques instants."
              : "Nous vérifions votre paiement Alma. Merci de patienter."}
          </p>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-amber-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Paiement non confirmé
          </h1>
          <p className="text-stone-500 mb-6">
            Nous n&apos;avons pas pu confirmer votre paiement. Si vous avez été débité,
            notre équipe vous contactera sous peu. Vous pouvez aussi nous contacter directement.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/panier"
              className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 rounded-lg font-medium text-stone-700 hover:bg-stone-100 transition-colors justify-center"
            >
              <ShoppingBag size={18} />
              Retour au panier
            </Link>
            <Link
              href="tel:+33478526222"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors justify-center"
            >
              Nous contacter
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check size={32} className="text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-stone-900 mb-2">
          Paiement confirmé !
        </h1>
        <p className="text-stone-500 mb-2">
          Merci pour votre commande. Votre paiement Alma en plusieurs fois a été accepté.
        </p>
        {orderNumber && (
          <p className="text-sm text-stone-400 mb-6">
            Commande n° <span className="font-mono font-medium text-stone-700">{orderNumber}</span>
          </p>
        )}
        <p className="text-sm text-stone-500 mb-6">
          Vous recevrez un email de confirmation avec les détails de votre commande et 
          l&apos;échéancier de paiement.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/compte"
            className="inline-flex items-center gap-2 px-6 py-3 border border-stone-300 rounded-lg font-medium text-stone-700 hover:bg-stone-100 transition-colors justify-center"
          >
            Mes commandes
          </Link>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors justify-center"
          >
            Continuer mes achats
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function AlmaRetourPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-stone-50 flex items-center justify-center">
          <Loader2 size={48} className="text-stone-400 animate-spin" />
        </main>
      }
    >
      <AlmaRetourContent />
    </Suspense>
  );
}
