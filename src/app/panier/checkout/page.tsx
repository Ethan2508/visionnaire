"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Store,
  CreditCard,
  ShoppingBag,
  Loader2,
  Check,
  Tag,
  X,
} from "lucide-react";

type Step = "livraison" | "paiement" | "confirmation";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, getSubtotal, getItemCount, clearCart } =
    useCartStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("livraison");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Livraison
  const [deliveryMethod, setDeliveryMethod] = useState<"domicile" | "boutique">("domicile");
  const [address, setAddress] = useState({
    firstName: "",
    lastName: "",
    street: "",
    street2: "",
    city: "",
    postalCode: "",
    country: "France",
  });

  // Paiement Alma
  const [almaInstallments, setAlmaInstallments] = useState<1 | 2 | 3 | 4 | 12>(1);

  // Code promo
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState<{
    code: string;
    discount_type: "percentage" | "fixed";
    discount_value: number;
    name: string;
  } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-stone-50 py-12 px-4">
        <div className="max-w-3xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-stone-200 rounded w-48" />
          <div className="h-96 bg-stone-200 rounded-xl" />
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    router.push("/panier");
    return null;
  }

  const subtotal = getSubtotal();
  const total = getTotal();
  const shippingCost = deliveryMethod === "domicile" && total < 150 ? 6.9 : 0;

  // Calcul discount
  let discount = 0;
  if (promoApplied) {
    if (promoApplied.discount_type === "percentage") {
      discount = total * (promoApplied.discount_value / 100);
    } else {
      discount = Math.min(promoApplied.discount_value, total);
    }
  }
  const finalTotal = total - discount + shippingCost;

  async function applyPromoCode() {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const res = await fetch("/api/promotions/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode.trim().toUpperCase(), orderTotal: total }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoError(data.error || "Code invalide");
        setPromoApplied(null);
      } else {
        setPromoApplied(data.promotion);
        setPromoError(null);
      }
    } catch {
      setPromoError("Erreur de validation");
    }
    setPromoLoading(false);
  }

  function removePromo() {
    setPromoApplied(null);
    setPromoCode("");
    setPromoError(null);
  }

  async function handleSubmitOrder() {
    setError(null);
    setLoading(true);

    try {
      // Vérifier l'authentification
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();

      if (!meData.user) {
        router.push(`/auth/login?redirect=/panier/checkout`);
        return;
      }

      // Créer la commande
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            variantId: item.variantId,
            productName: item.productName,
            colorName: item.colorName,
            size: item.size,
            quantity: item.quantity,
          })),
          deliveryMethod,
          shippingAddress: deliveryMethod === "domicile" ? address : null,
          paymentMethod: "alma",
          promoCode: promoApplied?.code || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la commande");
        setLoading(false);
        return;
      }

      // Créer le paiement Alma et rediriger
      const almaRes = await fetch("/api/alma/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: data.orderId,
          installments: almaInstallments,
        }),
      });

      const almaData = await almaRes.json();

      if (!almaRes.ok) {
        setError(almaData.error || "Erreur lors de la création du paiement Alma");
        setLoading(false);
        return;
      }

      // Rediriger vers la page de paiement Alma
      window.location.href = almaData.paymentUrl;
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.");
      setLoading(false);
    }
  }

  const steps: { key: Step; label: string }[] = [
    { key: "livraison", label: "Livraison" },
    { key: "paiement", label: "Paiement" },
    { key: "confirmation", label: "Confirmation" },
  ];

  if (step === "confirmation") {
    return (
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check size={32} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-semibold text-stone-900 mb-2">
            Commande confirmée !
          </h1>
          <p className="text-stone-500 mb-6">
            Merci pour votre commande. Vous recevrez un email de confirmation
            sous peu.
          </p>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 bg-stone-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 py-8 sm:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Link
          href="/panier"
          className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Retour au panier
        </Link>

        <h1 className="text-2xl sm:text-3xl font-semibold text-stone-900 mb-8">
          Finaliser la commande
        </h1>

        {/* Steps */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  s.key === step
                    ? "bg-stone-900 text-white"
                    : steps.indexOf(steps.find((x) => x.key === step)!) > i
                    ? "bg-green-100 text-green-700"
                    : "bg-stone-200 text-stone-500"
                }`}
              >
                {steps.indexOf(steps.find((x) => x.key === step)!) > i ? (
                  <Check size={16} />
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`text-sm hidden sm:inline ${
                  s.key === step
                    ? "font-medium text-stone-900"
                    : "text-stone-400"
                }`}
              >
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className="w-8 sm:w-16 h-px bg-stone-200" />
              )}
            </div>
          ))}
        </div>

        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Étape Livraison */}
            {step === "livraison" && (
              <>
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <h2 className="text-lg font-semibold text-stone-900 mb-4">
                    Mode de livraison
                  </h2>
                  <div className="space-y-3">
                    <label
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        deliveryMethod === "domicile"
                          ? "border-stone-900 bg-stone-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value="domicile"
                        checked={deliveryMethod === "domicile"}
                        onChange={() => setDeliveryMethod("domicile")}
                        className="sr-only"
                      />
                      <MapPin
                        size={20}
                        className={
                          deliveryMethod === "domicile"
                            ? "text-stone-900"
                            : "text-stone-400"
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">
                          Livraison à domicile
                        </p>
                        <p className="text-sm text-stone-500">
                          {total >= 150
                            ? "Gratuite"
                            : `${formatPrice(6.9)} — Offerte dès ${formatPrice(150)}`}
                        </p>
                      </div>
                    </label>
                    <label
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        deliveryMethod === "boutique"
                          ? "border-stone-900 bg-stone-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="delivery"
                        value="boutique"
                        checked={deliveryMethod === "boutique"}
                        onChange={() => setDeliveryMethod("boutique")}
                        className="sr-only"
                      />
                      <Store
                        size={20}
                        className={
                          deliveryMethod === "boutique"
                            ? "text-stone-900"
                            : "text-stone-400"
                        }
                      />
                      <div className="flex-1">
                        <p className="font-medium text-stone-900">
                          Retrait en boutique
                        </p>
                        <p className="text-sm text-stone-500">Gratuit</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Formulaire d'adresse */}
                {deliveryMethod === "domicile" && (
                  <div className="bg-white rounded-xl border border-stone-200 p-6">
                    <h2 className="text-lg font-semibold text-stone-900 mb-4">
                      Adresse de livraison
                    </h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Prénom
                        </label>
                        <input
                          type="text"
                          value={address.firstName}
                          onChange={(e) =>
                            setAddress({ ...address, firstName: e.target.value })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Nom
                        </label>
                        <input
                          type="text"
                          value={address.lastName}
                          onChange={(e) =>
                            setAddress({ ...address, lastName: e.target.value })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Adresse
                        </label>
                        <input
                          type="text"
                          value={address.street}
                          onChange={(e) =>
                            setAddress({ ...address, street: e.target.value })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                          placeholder="123 rue de la Paix"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Complément d&apos;adresse
                        </label>
                        <input
                          type="text"
                          value={address.street2}
                          onChange={(e) =>
                            setAddress({ ...address, street2: e.target.value })
                          }
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                          placeholder="Appartement, étage..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Code postal
                        </label>
                        <input
                          type="text"
                          value={address.postalCode}
                          onChange={(e) =>
                            setAddress({
                              ...address,
                              postalCode: e.target.value,
                            })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Ville
                        </label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) =>
                            setAddress({ ...address, city: e.target.value })
                          }
                          required
                          className="w-full px-4 py-2.5 border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent text-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (
                      deliveryMethod === "domicile" &&
                      (!address.firstName ||
                        !address.lastName ||
                        !address.street ||
                        !address.postalCode ||
                        !address.city)
                    ) {
                      setError("Veuillez remplir tous les champs obligatoires.");
                      return;
                    }
                    setError(null);
                    setStep("paiement");
                  }}
                  className="w-full bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
                >
                  Continuer vers le paiement
                  <ArrowRight size={18} />
                </button>
              </>
            )}

            {/* Étape Paiement */}
            {step === "paiement" && (
              <>
                <div className="bg-white rounded-xl border border-stone-200 p-6">
                  <h2 className="text-lg font-semibold text-stone-900 mb-4">
                    Moyen de paiement
                  </h2>
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-stone-100">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <CreditCard size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">Paiement sécurisé par Alma</p>
                      <p className="text-xs text-stone-500">Carte bancaire — Visa, Mastercard, CB</p>
                    </div>
                  </div>
                  <p className="text-sm text-stone-600 mb-3">Choisissez votre échéancier :</p>
                  <div className="grid grid-cols-5 gap-2">
                    {([1, 2, 3, 4, 12] as const).map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setAlmaInstallments(n)}
                        className={`py-3 px-2 rounded-xl text-center transition-all ${
                          almaInstallments === n
                            ? "bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-2"
                            : "bg-stone-50 text-stone-700 border border-stone-200 hover:border-stone-400 hover:bg-stone-100"
                        }`}
                      >
                        <span className="block text-lg font-bold">{n === 1 ? "1×" : `${n}×`}</span>
                        <span className={`block text-xs mt-1 ${almaInstallments === n ? "text-stone-300" : "text-stone-500"}`}>
                          {n === 1 ? "Comptant" : `${formatPrice(finalTotal / n)}/mois`}
                        </span>
                      </button>
                    ))}
                  </div>
                  {almaInstallments > 1 && (
                    <p className="text-xs text-stone-500 mt-3 text-center">
                      {almaInstallments}× {formatPrice(finalTotal / almaInstallments)} — Total : {formatPrice(finalTotal)}
                    </p>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg border border-red-200">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep("livraison")}
                    className="flex-1 py-3 rounded-lg font-medium border border-stone-300 text-stone-700 hover:bg-stone-100 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={18} />
                    Retour
                  </button>
                  <button
                    onClick={handleSubmitOrder}
                    disabled={loading}
                    className="flex-1 bg-stone-900 text-white py-3 rounded-lg font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Payer {formatPrice(finalTotal)}
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Résumé latéral */}
          <div className="mt-8 lg:mt-0">
            <div className="bg-white rounded-xl border border-stone-200 p-6 sticky top-28">
              <h2 className="text-lg font-semibold text-stone-900 mb-4">
                Résumé
              </h2>

              {/* Articles */}
              <div className="space-y-3 mb-4">
                {items.map((item) => (
                  <div
                    key={item.variantId}
                    className="flex gap-3 text-sm"
                  >
                    <div className="w-12 h-12 bg-stone-100 rounded overflow-hidden flex-shrink-0">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <ShoppingBag size={16} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-stone-900 truncate">
                        {item.productName}
                      </p>
                      <p className="text-stone-500 text-xs">
                        {item.colorName} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium text-stone-900 flex-shrink-0">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-stone-100 pt-3 space-y-2 text-sm">
                {/* Code promo */}
                <div className="pb-2">
                  {promoApplied ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-green-600" />
                        <span className="text-sm font-medium text-green-800">{promoApplied.code}</span>
                        <span className="text-xs text-green-600">
                          (-{promoApplied.discount_type === "percentage" ? `${promoApplied.discount_value}%` : formatPrice(promoApplied.discount_value)})
                        </span>
                      </div>
                      <button onClick={removePromo} className="text-green-600 hover:text-green-800"><X size={14} /></button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          placeholder="Code promo"
                          className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-stone-900 font-mono"
                        />
                        <button
                          onClick={applyPromoCode}
                          disabled={promoLoading || !promoCode.trim()}
                          className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                        >
                          {promoLoading ? "…" : "Appliquer"}
                        </button>
                      </div>
                      {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
                    </div>
                  )}
                </div>

                <div className="flex justify-between text-stone-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Réduction</span>
                    <span>-{formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-stone-600">
                  <span>Livraison</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600 font-medium">
                        Offerte
                      </span>
                    ) : (
                      formatPrice(shippingCost)
                    )}
                  </span>
                </div>
                <div className="border-t border-stone-100 pt-2 flex justify-between font-semibold text-stone-900 text-base">
                  <span>Total</span>
                  <span>{formatPrice(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
